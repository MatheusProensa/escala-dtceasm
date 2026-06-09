import { useState, useMemo } from 'react';
import { Zap, Save, AlertTriangle, CheckCircle } from 'lucide-react';
import type { Soldado, Indisponibilidade, DataEspecial, Escala, EscalaDia } from '../../types';
import { gerarEscala, getNextMonthStart, getNextMonthEnd, computeQuadrinhosFromDias } from '../../utils/scheduler';
import { formatDateBR, getDayName } from '../../utils/dateUtils';

interface GerarEscalaProps {
  soldados: Soldado[];
  indisponibilidades: Indisponibilidade[];
  datasEspeciais: DataEspecial[];
  escalas: Escala[];
  onSave: (escala: Omit<Escala, 'id' | 'geradaEm'>) => Escala;
  onGoToHistorico: () => void;
}

type TipoQuadrinho = 'preta' | 'amarela' | 'vermelha' | 'roxa';

function tipoLabel(tipo: TipoQuadrinho): string {
  switch (tipo) {
    case 'preta': return 'Preta';
    case 'amarela': return 'Amarela';
    case 'vermelha': return 'Vermelha';
    case 'roxa': return 'Roxa';
  }
}

function getSoldadoLabel(soldados: Soldado[], id: string | null): string {
  if (!id) return '—';
  const s = soldados.find(x => x.id === id);
  if (!s) return '(removido)';
  return s.patente ? `${s.patente} ${s.nome}` : s.nome;
}

export default function GerarEscala({
  soldados,
  indisponibilidades,
  datasEspeciais,
  escalas,
  onSave,
  onGoToHistorico,
}: GerarEscalaProps) {
  const [nome, setNome] = useState('');
  const [inicio, setInicio] = useState(getNextMonthStart());
  const [fim, setFim] = useState(getNextMonthEnd());
  const [preview, setPreview] = useState<EscalaDia[] | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const activeSoldados = soldados.filter(s => s.ativo);

  function handleGerar(e: React.FormEvent) {
    e.preventDefault();
    if (!inicio || !fim || fim < inicio) return;
    const dias = gerarEscala(inicio, fim, soldados, indisponibilidades, datasEspeciais, escalas);
    setPreview(dias);
    setSavedId(null);
  }

  function handleSave() {
    if (!preview || !nome.trim()) return;
    setIsSaving(true);
    const escala = onSave({
      nome: nome.trim(),
      periodo: { inicio, fim },
      dias: preview,
    });
    setSavedId(escala.id);
    setIsSaving(false);
  }

  // Compute warnings
  const warnings = useMemo(() => {
    if (!preview) return { nullDays: [], exceptioned: [] };
    const nullDays = preview.filter(d => !d.soldadoId);
    const exceptioned = preview.filter(d => d.excepcionouIntervalo);
    return { nullDays, exceptioned };
  }, [preview]);

  // Summary by tipo
  const tipoSummary = useMemo(() => {
    if (!preview) return null;
    const counts: Record<TipoQuadrinho, number> = { preta: 0, amarela: 0, vermelha: 0, roxa: 0 };
    for (const d of preview) counts[d.tipoQuadrinho]++;
    return counts;
  }, [preview]);

  // Summary by soldado
  const soldadoSummary = useMemo(() => {
    if (!preview) return null;
    return computeQuadrinhosFromDias(preview);
  }, [preview]);

  const isFormValid = inicio && fim && fim >= inicio && nome.trim().length > 0;
  const canSave = preview && nome.trim() && !savedId;

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Gerar Escala</div>
          <div className="page-subtitle">Defina o período e gere a escala automaticamente</div>
        </div>
      </div>

      {activeSoldados.length === 0 && (
        <div className="alert alert-warning mb-4">
          <AlertTriangle size={16} />
          Não há militares ativos cadastrados. Adicione militares antes de gerar a escala.
        </div>
      )}

      {/* Form */}
      <div className="card mb-4">
        <form onSubmit={handleGerar}>
          <div className="form-row" style={{ marginBottom: '1rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="g-nome">Nome da Escala *</label>
              <input
                id="g-nome"
                type="text"
                value={nome}
                onChange={e => setNome(e.target.value)}
                placeholder="Ex: Escala Janeiro 2026"
                required
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label htmlFor="g-inicio">Data de Início *</label>
                <input
                  id="g-inicio"
                  type="date"
                  value={inicio}
                  onChange={e => {
                    setInicio(e.target.value);
                    setPreview(null);
                    setSavedId(null);
                  }}
                  required
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label htmlFor="g-fim">Data de Fim *</label>
                <input
                  id="g-fim"
                  type="date"
                  value={fim}
                  min={inicio}
                  onChange={e => {
                    setFim(e.target.value);
                    setPreview(null);
                    setSavedId(null);
                  }}
                  required
                />
              </div>
            </div>
          </div>
          {fim && inicio && fim < inicio && (
            <div className="alert alert-danger mb-3">
              A data de fim deve ser igual ou posterior à data de início.
            </div>
          )}
          <button
            className="btn btn-primary"
            type="submit"
            disabled={!isFormValid || activeSoldados.length === 0}
          >
            <Zap size={16} />
            Gerar Prévia
          </button>
        </form>
      </div>

      {/* Tips — shown only before preview */}
      {!preview && (
        <div className="card" style={{ borderLeft: '3px solid var(--accent)' }}>
          <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
            Como funciona
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
            {[
              'Preencha o nome, data de início e data de fim da escala.',
              'Clique em "Gerar Prévia" para visualizar a escala antes de salvar.',
              'O algoritmo distribui os tipos (Preta, Amarela, Vermelha, Roxa) respeitando a regra de 48h e as indisponibilidades registradas.',
              'Confira a prévia e clique em "Salvar Escala" para registrar no histórico.',
            ].map((txt, i) => (
              <div key={i} style={{ display: 'flex', gap: '0.5rem' }}>
                <span style={{ color: 'var(--accent)', fontWeight: 700, flexShrink: 0 }}>{i + 1}.</span>
                <span>{txt}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preview */}
      {preview && (
        <>
          {/* Warnings */}
          {(warnings.nullDays.length > 0 || warnings.exceptioned.length > 0) && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
              {warnings.nullDays.length > 0 && (
                <div className="alert alert-danger">
                  <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                  <div>
                    <strong>{warnings.nullDays.length} dia(s) sem soldado disponível:</strong>{' '}
                    {warnings.nullDays.map(d => formatDateBR(d.data)).join(', ')}
                  </div>
                </div>
              )}
              {warnings.exceptioned.length > 0 && (
                <div className="alert alert-warning">
                  <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                  <div>
                    <strong>{warnings.exceptioned.length} dia(s) com intervalo excepcionado</strong> (regra de 48h desconsiderada por falta de candidatos):
                    {' '}{warnings.exceptioned.map(d => formatDateBR(d.data)).join(', ')}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tipo Summary */}
          {tipoSummary && (
            <div className="card mb-4">
              <div className="card-title mb-2" style={{ fontSize: '0.875rem' }}>Resumo por Tipo</div>
              <div className="flex items-center gap-3" style={{ flexWrap: 'wrap' }}>
                {(['preta', 'amarela', 'vermelha', 'roxa'] as TipoQuadrinho[]).map(tipo => (
                  <div key={tipo} className="flex items-center gap-1">
                    <span className={`badge badge-${tipo}`}>{tipoLabel(tipo)}</span>
                    <span className="font-semibold">{tipoSummary[tipo]}</span>
                  </div>
                ))}
                <span className="text-secondary text-sm">
                  Total: {preview.length} dias
                </span>
              </div>
            </div>
          )}

          {/* Soldado Summary */}
          {soldadoSummary && Object.keys(soldadoSummary).length > 0 && (
            <div className="card mb-4">
              <div className="card-title mb-2" style={{ fontSize: '0.875rem' }}>Quadrinhos Nesta Escala (por soldado)</div>
              <div className="summary-grid">
                {activeSoldados
                  .sort((a, b) => a.ordemAntiguidade - b.ordemAntiguidade)
                  .map(s => {
                    const q = soldadoSummary[s.id] ?? { preta: 0, amarela: 0, vermelha: 0, roxa: 0 };
                    const total = q.preta + q.amarela + q.vermelha + q.roxa;
                    if (total === 0) return null;
                    return (
                      <div key={s.id} className="summary-card">
                        <div className="summary-card-name">
                          {s.patente ? `${s.patente} ${s.nome}` : s.nome}
                        </div>
                        <div className="summary-card-counts">
                          <span className="q-count q-count-preta" title="Preta">{q.preta}</span>
                          <span className="q-count q-count-amarela" title="Amarela">{q.amarela}</span>
                          <span className="q-count q-count-vermelha" title="Vermelha">{q.vermelha}</span>
                          <span className="q-count q-count-roxa" title="Roxa">{q.roxa}</span>
                          <span className="text-secondary text-xs" style={{ alignSelf: 'center' }}>
                            = {total}
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Preview Table */}
          <div className="card mb-4">
            <div className="card-header">
              <span className="card-title">Prévia da Escala ({preview.length} dias)</span>
              <div className="flex items-center gap-2">
                {savedId ? (
                  <div className="flex items-center gap-1" style={{ color: 'var(--success)', fontSize: '0.875rem' }}>
                    <CheckCircle size={16} />
                    Salva com sucesso!
                  </div>
                ) : (
                  <button
                    className="btn btn-primary"
                    onClick={handleSave}
                    disabled={!canSave || isSaving}
                    type="button"
                  >
                    <Save size={16} />
                    Salvar Escala
                  </button>
                )}
              </div>
            </div>

            {savedId && (
              <div className="alert alert-info mb-3">
                <CheckCircle size={16} />
                Escala salva!{' '}
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={onGoToHistorico}
                  type="button"
                  style={{ marginLeft: '0.5rem' }}
                >
                  Ver no Histórico
                </button>
              </div>
            )}

            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Dia</th>
                    <th>Tipo</th>
                    <th>Soldado</th>
                    <th title="Exceção de intervalo">Obs</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map(dia => {
                    const dow = new Date(dia.data + 'T12:00:00').getDay();
                    const rowCls = [
                      dia.excepcionouIntervalo ? 'exception-row' : '',
                      dow === 0 || dow === 6 ? 'row-weekend' : '',
                      dow === 5 ? 'row-friday' : '',
                    ].filter(Boolean).join(' ');
                    return (
                    <tr key={dia.data} className={rowCls}>
                      <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{formatDateBR(dia.data)}</td>
                      <td style={{ fontWeight: 600 }}>{getDayName(dia.data)}</td>
                      <td>
                        <span className={`badge badge-${dia.tipoQuadrinho}`}>
                          {tipoLabel(dia.tipoQuadrinho)}
                        </span>
                      </td>
                      <td>
                        {dia.soldadoId ? (
                          <span style={{ fontWeight: 500 }}>{getSoldadoLabel(soldados, dia.soldadoId)}</span>
                        ) : (
                          <span className="text-danger" style={{ fontWeight: 500 }}>SEM SOLDADO</span>
                        )}
                      </td>
                      <td>
                        {dia.excepcionouIntervalo && (
                          <span title="Regra de 48h excepcionada" style={{ color: 'var(--warning)' }}>
                            <AlertTriangle size={14} />
                          </span>
                        )}
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
