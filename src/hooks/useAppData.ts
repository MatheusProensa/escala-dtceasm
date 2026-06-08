import { useState, useEffect } from 'react';
import type { AppData, Soldado, Indisponibilidade, DataEspecial, Escala } from '../types';

const STORAGE_KEY = 'escala-dtceasm-data';

const defaultData: AppData = {
  soldados: [],
  indisponibilidades: [],
  datasEspeciais: [],
  escalas: [],
};

function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultData;
    const parsed = JSON.parse(raw) as Partial<AppData>;
    return {
      soldados: parsed.soldados ?? [],
      indisponibilidades: parsed.indisponibilidades ?? [],
      datasEspeciais: parsed.datasEspeciais ?? [],
      escalas: parsed.escalas ?? [],
    };
  } catch {
    return defaultData;
  }
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function useAppData() {
  const [data, setData] = useState<AppData>(loadData);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  // ---- Soldados ----

  function addSoldado(soldado: Omit<Soldado, 'id'>): Soldado {
    const newSoldado: Soldado = { ...soldado, id: generateId() };
    setData(prev => ({ ...prev, soldados: [...prev.soldados, newSoldado] }));
    return newSoldado;
  }

  function updateSoldado(id: string, updates: Partial<Omit<Soldado, 'id'>>): void {
    setData(prev => ({
      ...prev,
      soldados: prev.soldados.map(s => (s.id === id ? { ...s, ...updates } : s)),
    }));
  }

  function deleteSoldado(id: string): void {
    setData(prev => ({
      ...prev,
      soldados: prev.soldados.filter(s => s.id !== id),
      indisponibilidades: prev.indisponibilidades.filter(i => i.soldadoId !== id),
    }));
  }

  function reorderSoldados(soldadoId: string, direction: 'up' | 'down'): void {
    setData(prev => {
      const sorted = [...prev.soldados].sort((a, b) => a.ordemAntiguidade - b.ordemAntiguidade);
      const idx = sorted.findIndex(s => s.id === soldadoId);
      if (idx < 0) return prev;

      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= sorted.length) return prev;

      // Swap ordemAntiguidade values
      const current = sorted[idx];
      const target = sorted[targetIdx];
      if (!current || !target) return prev;

      const currentOrd = current.ordemAntiguidade;
      const targetOrd = target.ordemAntiguidade;

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
    setData(prev => ({
      ...prev,
      indisponibilidades: [...prev.indisponibilidades, newInd],
    }));
  }

  function deleteIndisponibilidade(id: string): void {
    setData(prev => ({
      ...prev,
      indisponibilidades: prev.indisponibilidades.filter(i => i.id !== id),
    }));
  }

  // ---- Datas Especiais ----

  function addDataEspecial(de: Omit<DataEspecial, 'id'>): void {
    const newDE: DataEspecial = { ...de, id: generateId() };
    setData(prev => ({
      ...prev,
      datasEspeciais: [...prev.datasEspeciais, newDE],
    }));
  }

  function deleteDataEspecial(id: string): void {
    setData(prev => ({
      ...prev,
      datasEspeciais: prev.datasEspeciais.filter(d => d.id !== id),
    }));
  }

  // ---- Escalas ----

  function saveEscala(escala: Omit<Escala, 'id' | 'geradaEm'>): Escala {
    const newEscala: Escala = {
      ...escala,
      id: generateId(),
      geradaEm: new Date().toISOString(),
    };
    setData(prev => ({
      ...prev,
      escalas: [...prev.escalas, newEscala],
    }));
    return newEscala;
  }

  function deleteEscala(id: string): void {
    setData(prev => ({
      ...prev,
      escalas: prev.escalas.filter(e => e.id !== id),
    }));
  }

  return {
    data,
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
  };
}
