import { useState, useEffect } from 'react';
import type { AppData, Soldado, Indisponibilidade, DataEspecial, Escala, TrocaServico } from '../types';
import { supabase } from '../lib/supabase';

const defaultData: AppData = {
  soldados: [],
  indisponibilidades: [],
  datasEspeciais: [],
  escalas: [],
  trocas: [],
};

function generateId(): string {
  return crypto.randomUUID();
}

export function useAppData() {
  const [data, setData] = useState<AppData>(defaultData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Only load data when there's an active session (RLS requires auth)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        loadAllData();
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        loadAllData();
      } else if (event === 'SIGNED_OUT') {
        setData(defaultData);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function loadAllData() {
    setLoading(true);
    setError(null);
    try {
      const [soldadosRes, indispRes, datasRes, escalasRes, trocasRes] = await Promise.all([
        supabase.from('soldados').select('*').order('ordem_antiguidade'),
        supabase.from('indisponibilidades').select('*'),
        supabase.from('datas_especiais').select('*'),
        supabase.from('escalas').select('*').order('gerada_em', { ascending: false }),
        supabase.from('trocas_servico').select('*').order('data', { ascending: false }),
      ]);

      if (soldadosRes.error) throw soldadosRes.error;
      if (indispRes.error) throw indispRes.error;
      if (datasRes.error) throw datasRes.error;
      if (escalasRes.error) throw escalasRes.error;
      // trocas_servico pode ainda não existir — não bloqueia o carregamento

      setData({
        soldados: (soldadosRes.data ?? []).map(s => ({
          id: s.id as string,
          nome: s.nome as string,
          patente: s.patente as string,
          ativo: s.ativo as boolean,
          ordemAntiguidade: s.ordem_antiguidade as number,
        })),
        indisponibilidades: (indispRes.data ?? []).map(i => ({
          id: i.id as string,
          soldadoId: i.soldado_id as string,
          dataInicio: i.data_inicio as string,
          dataFim: i.data_fim as string,
          motivo: i.motivo as string,
        })),
        datasEspeciais: (datasRes.data ?? []).map(d => ({
          id: d.id as string,
          data: d.data as string,
          tipo: d.tipo as DataEspecial['tipo'],
          descricao: d.descricao as string,
        })),
        escalas: (escalasRes.data ?? []).map(e => ({
          id: e.id as string,
          nome: e.nome as string,
          periodo: { inicio: e.periodo_inicio as string, fim: e.periodo_fim as string },
          dias: e.dias as Escala['dias'],
          geradaEm: e.gerada_em as string,
        })),
        trocas: trocasRes.error ? [] : (trocasRes.data ?? []).map(t => ({
          id: t.id as string,
          data: t.data as string,
          soldadoSubstituidoId: t.soldado_substituido_id as string,
          soldadoSubstitutoId: t.soldado_substituto_id as string,
          observacao: (t.observacao as string) ?? '',
          criadaEm: t.criada_em as string,
        })),
      });
    } catch (err) {
      console.error('loadAllData:', err);
      setError('Erro ao carregar dados. Verifique a conexão.');
    } finally {
      setLoading(false);
    }
  }

  // ---- Soldados ----

  function addSoldado(soldado: Omit<Soldado, 'id'>): Soldado {
    const newSoldado: Soldado = { ...soldado, id: generateId() };
    setData(prev => ({ ...prev, soldados: [...prev.soldados, newSoldado] }));
    supabase.from('soldados').insert({
      id: newSoldado.id,
      nome: newSoldado.nome,
      patente: newSoldado.patente,
      ativo: newSoldado.ativo,
      ordem_antiguidade: newSoldado.ordemAntiguidade,
    }).then(({ error }) => { if (error) console.error('addSoldado:', error); });
    return newSoldado;
  }

  function updateSoldado(id: string, updates: Partial<Omit<Soldado, 'id'>>): void {
    setData(prev => ({
      ...prev,
      soldados: prev.soldados.map(s => (s.id === id ? { ...s, ...updates } : s)),
    }));
    const dbUpdates: Record<string, unknown> = {};
    if (updates.nome !== undefined) dbUpdates.nome = updates.nome;
    if (updates.patente !== undefined) dbUpdates.patente = updates.patente;
    if (updates.ativo !== undefined) dbUpdates.ativo = updates.ativo;
    if (updates.ordemAntiguidade !== undefined) dbUpdates.ordem_antiguidade = updates.ordemAntiguidade;
    supabase.from('soldados').update(dbUpdates).eq('id', id)
      .then(({ error }) => { if (error) console.error('updateSoldado:', error); });
  }

  function deleteSoldado(id: string): void {
    setData(prev => ({
      ...prev,
      soldados: prev.soldados.filter(s => s.id !== id),
      indisponibilidades: prev.indisponibilidades.filter(i => i.soldadoId !== id),
    }));
    supabase.from('soldados').delete().eq('id', id)
      .then(({ error }) => { if (error) console.error('deleteSoldado:', error); });
  }

  function reorderSoldados(soldadoId: string, direction: 'up' | 'down'): void {
    setData(prev => {
      const sorted = [...prev.soldados].sort((a, b) => a.ordemAntiguidade - b.ordemAntiguidade);
      const idx = sorted.findIndex(s => s.id === soldadoId);
      if (idx < 0) return prev;
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= sorted.length) return prev;
      const current = sorted[idx];
      const target = sorted[targetIdx];
      if (!current || !target) return prev;
      const currentOrd = current.ordemAntiguidade;
      const targetOrd = target.ordemAntiguidade;
      supabase.from('soldados').update({ ordem_antiguidade: targetOrd }).eq('id', current.id)
        .then(({ error }) => { if (error) console.error('reorder1:', error); });
      supabase.from('soldados').update({ ordem_antiguidade: currentOrd }).eq('id', target.id)
        .then(({ error }) => { if (error) console.error('reorder2:', error); });
      return {
        ...prev,
        soldados: prev.soldados.map(s => {
          if (s.id === current.id) return { ...s, ordemAntiguidade: targetOrd };
          if (s.id === target.id) return { ...s, ordemAntiguidade: currentOrd };
          return s;
        }),
      };
    });
  }

  // ---- Indisponibilidades ----

  function addIndisponibilidade(ind: Omit<Indisponibilidade, 'id'>): void {
    const newInd: Indisponibilidade = { ...ind, id: generateId() };
    setData(prev => ({ ...prev, indisponibilidades: [...prev.indisponibilidades, newInd] }));
    supabase.from('indisponibilidades').insert({
      id: newInd.id,
      soldado_id: newInd.soldadoId,
      data_inicio: newInd.dataInicio,
      data_fim: newInd.dataFim,
      motivo: newInd.motivo,
    }).then(({ error }) => { if (error) console.error('addIndisp:', error); });
  }

  function deleteIndisponibilidade(id: string): void {
    setData(prev => ({
      ...prev,
      indisponibilidades: prev.indisponibilidades.filter(i => i.id !== id),
    }));
    supabase.from('indisponibilidades').delete().eq('id', id)
      .then(({ error }) => { if (error) console.error('deleteIndisp:', error); });
  }

  // ---- Datas Especiais ----

  function addDataEspecial(de: Omit<DataEspecial, 'id'>): void {
    const newDE: DataEspecial = { ...de, id: generateId() };
    setData(prev => ({ ...prev, datasEspeciais: [...prev.datasEspeciais, newDE] }));
    supabase.from('datas_especiais').insert({
      id: newDE.id,
      data: newDE.data,
      tipo: newDE.tipo,
      descricao: newDE.descricao,
    }).then(({ error }) => { if (error) console.error('addDataEspecial:', error); });
  }

  function deleteDataEspecial(id: string): void {
    setData(prev => ({ ...prev, datasEspeciais: prev.datasEspeciais.filter(d => d.id !== id) }));
    supabase.from('datas_especiais').delete().eq('id', id)
      .then(({ error }) => { if (error) console.error('deleteDataEspecial:', error); });
  }

  // ---- Escalas ----

  function saveEscala(escala: Omit<Escala, 'id' | 'geradaEm'>): Escala {
    const newEscala: Escala = {
      ...escala,
      id: generateId(),
      geradaEm: new Date().toISOString(),
    };
    setData(prev => ({ ...prev, escalas: [...prev.escalas, newEscala] }));
    supabase.from('escalas').insert({
      id: newEscala.id,
      nome: newEscala.nome,
      periodo_inicio: newEscala.periodo.inicio,
      periodo_fim: newEscala.periodo.fim,
      dias: newEscala.dias,
      gerada_em: newEscala.geradaEm,
    }).then(({ error }) => { if (error) console.error('saveEscala:', error); });
    return newEscala;
  }

  function deleteEscala(id: string): void {
    setData(prev => ({ ...prev, escalas: prev.escalas.filter(e => e.id !== id) }));
    supabase.from('escalas').delete().eq('id', id)
      .then(({ error }) => { if (error) console.error('deleteEscala:', error); });
  }

  // ---- Trocas de Serviço ----

  function addTroca(troca: Omit<TrocaServico, 'id' | 'criadaEm'>): void {
    const newTroca: TrocaServico = { ...troca, id: generateId(), criadaEm: new Date().toISOString() };
    setData(prev => ({ ...prev, trocas: [newTroca, ...prev.trocas] }));
    supabase.from('trocas_servico').insert({
      id: newTroca.id,
      data: newTroca.data,
      soldado_substituido_id: newTroca.soldadoSubstituidoId,
      soldado_substituto_id: newTroca.soldadoSubstitutoId,
      observacao: newTroca.observacao,
      criada_em: newTroca.criadaEm,
    }).then(({ error }) => { if (error) console.error('addTroca:', error); });
  }

  function deleteTroca(id: string): void {
    setData(prev => ({ ...prev, trocas: prev.trocas.filter(t => t.id !== id) }));
    supabase.from('trocas_servico').delete().eq('id', id)
      .then(({ error }) => { if (error) console.error('deleteTroca:', error); });
  }

  return {
    data,
    loading,
    error,
    addSoldado,
    updateSoldado,
    deleteSoldado,
    reorderSoldados,
    addIndisponibilidade,
    deleteIndisponibilidade,
    addDataEspecial,
    deleteDataEspecial,
    saveEscala,
    deleteEscala,
    addTroca,
    deleteTroca,
  };
}
