import { useState } from 'react';
import { Archive, Eye, Trash2, ArrowLeft, FileDown, AlertTriangle } from 'lucide-react';
import type { Soldado, Escala, Indisponibilidade, DataEspecial } from '../../types';
import { formatDateBR, getDayName } from '../../utils/dateUtils';
import { computeQuadrinhosFromDias } from '../../utils/scheduler';
import { generatePrintHtml } from '../../utils/printHtml';

interface HistoricoProps {
  soldados: Soldado[];
  escalas: Escala[];
  indisponibilidades: Indisponibilidade[];
  datasEspeciais: DataEspecial[];
  onDelete: (id: string) => void;
  escalante: string;
  comandante: string;
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

function formatDateTime(isoStr: string): string {
  try {
    const d = new Date(isoStr);
    return d.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoStr;
  }
}

export default function Historico({ soldados, escalas, indisponibilidades, datasEspeciais, onDelete, escalante, comandante }: HistoricoProps) {
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const sorted = [...escalas].sort((a, b) => b.geradaEm.localeCompare(a.geradaEm));
  const viewingEscala = viewingId ? escalas.find(e => e.id === viewingId) ?? null : null;

  const missingConfig = !escalante.trim() || !comandante.trim();

  function handleDelete(id: string) {
    if (viewingId === id) setViewingId(null);
    onDelete(id);
    setDeleteConfirmId(null);
  }

  function handleExport(escala: Escala) {
    const html = generatePrintHtml(
      escala,
      soldados,
      indisponibilidades,
      datasEspeciais,
      escalas,
      escalante,
      comandante,
    );

    const w = window.open('', '_blank');
    if (w) {
      w.document.write(html);
      w.document.close();
    }
  }

  if (viewingEscala) {
    const q = computeQuadrinhosFromDias(viewingEscala.dias);
    const activeSoldados = soldados
      .filter(s => s.ativo)
      .sort((a, b) => a.ordemAntiguidade - b.ordemAntiguidade);
    const exceptions = viewingEscala.dias.filter(d => d.excepcionouIntervalo);
    const nullDays = viewingEscala.dias.filter(d => !d.soldadoId);

    return (
      <div>
        {/* Screen header */}
        <div className="page-header">
          <div className="flex items-center gap-3">
            <button
              className="btn btn-ghost"
              onClick={() => setViewingId(null)}
              type="button"
            >
              <ArrowLeft size={16} />
              Voltar
            </button>
            <div>
              <div className="page-title">{viewingEscala.nome}</div>
              <div className="page-subtitle">
                {formatDateBR(viewingEscala.periodo.inicio)} a {formatDateBR(viewingEscala.periodo.fim)}
                {' · '}Gerada em {formatDateTime(viewingEscala.geradaEm)}
              </div>
            </div>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => handleExport(viewingEscala)}
            type="button"
            disabled={missingConfig}
            title={missingConfig ? 'Configure o escalante e comandante em Configurações' : 'Exportar PDF'}
          >
            <FileDown size={16} />
            Exportar PDF (Modelo Oficial)
          </button>
        </div>

        {/* Missing config warning */}
        {missingConfig && (
          <div className="alert alert-warning" style={{ marginBottom: '1rem' }}>
            <AlertTriangle size={16} style={{ flexShrink: 0 }} />
            <span>Configure o escalante e o comandante em <strong>Configurações</strong> antes de exportar o PDF.</span>
          </div>
        )}

        {/* Warnings */}
        {(nullDays.length > 0 || exceptions.length > 0) && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
            {nullDays.length > 0 && (
              <div className="alert alert-danger">
                <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                <span><strong>{nullDays.length} dia(s) sem militar disponível:</strong> {nullDays.map(d => formatDateBR(d.data)).join(', ')}</span>
              </div>
            )}
            {exceptions.length > 0 && (
              <div className="alert alert-warning">
                <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                <span><strong>{exceptions.length} dia(s) com intervalo de 48h excepcionado</strong></span>
              </div>
            )}
          </div>
        )}

        {/* Table */}
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Dia</th>
                <th>Tipo</th>
                <th>Militar</th>
                <th title="Observações">Obs</th>
              </tr>
            </thead>
            <tbody>
              {viewingEscala.dias.map(dia => {
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
                      <span className="text-danger" style={{ fontWeight: 500 }}>SEM MILITAR</span>
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

        {/* Soldado Summary */}
        {Object.keys(q).length > 0 && (
          <div className="card mt-4">
            <div className="card-title mb-2" style={{ fontSize: '0.875rem' }}>Quadrinhos Nesta Escala</div>
            <div className="summary-grid">
              {activeSoldados.map(s => {
                const sq = q[s.id] ?? { preta: 0, amarela: 0, vermelha: 0, roxa: 0 };
                const total = sq.preta + sq.amarela + sq.vermelha + sq.roxa;
                if (total === 0) return null;
                return (
                  <div key={s.id} className="summary-card">
                    <div className="summary-card-name">
                      {s.patente ? `${s.patente} ${s.nome}` : s.nome}
                    </div>
                    <div className="summary-card-counts">
                      <span className="q-count q-count-preta" title="Preta">{sq.preta}</span>
                      <span className="q-count q-count-amarela" title="Amarela">{sq.amarela}</span>
                      <span className="q-count q-count-vermelha" title="Vermelha">{sq.vermelha}</span>
                      <span className="q-count q-count-roxa" title="Roxa">{sq.roxa}</span>
                      <span className="text-secondary text-xs" style={{ alignSelf: 'center' }}>= {total}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Histórico de Escalas</div>
          <div className="page-subtitle">{escalas.length} escala(s) salva(s)</div>
        </div>
      </div>

      {/* Missing config warning */}
      {missingConfig && escalas.length > 0 && (
        <div className="alert alert-warning" style={{ marginBottom: '1rem' }}>
          <AlertTriangle size={16} style={{ flexShrink: 0 }} />
          <span>Configure o escalante e o comandante em <strong>Configurações</strong> antes de exportar o PDF.</span>
        </div>
      )}

      {escalas.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <Archive size={48} strokeWidth={1} />
          </div>
          <div className="empty-state-text">Nenhuma escala salva</div>
          <div className="empty-state-sub">Gere e salve uma escala para visualizá-la aqui</div>
        </div>
      ) : (
        <div className="escala-list">
          {sorted.map(escala => {
            const totalDias = escala.dias.length;
            const exceptions = escala.dias.filter(d => d.excepcionouIntervalo).length;
            const nullDays = escala.dias.filter(d => !d.soldadoId).length;

            return (
              <div key={escala.id} className="escala-list-item">
                <div className="escala-list-item-info">
                  <div className="escala-list-item-name">{escala.nome}</div>
                  <div className="escala-list-item-meta">
                    {formatDateBR(escala.periodo.inicio)} a {formatDateBR(escala.periodo.fim)}
                    {' · '}{totalDias} dias
                    {' · '}Gerada em {formatDateTime(escala.geradaEm)}
                    {exceptions > 0 && (
                      <span style={{ color: 'var(--warning)', marginLeft: '0.5rem' }}>
                        <AlertTriangle size={12} style={{ display: 'inline', verticalAlign: 'middle' }} />
                        {' '}{exceptions} exceção(ões)
                      </span>
                    )}
                    {nullDays > 0 && (
                      <span style={{ color: 'var(--danger)', marginLeft: '0.5rem' }}>
                        {nullDays} sem militar
                      </span>
                    )}
                  </div>
                </div>
                <div className="escala-list-item-actions">
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => handleExport(escala)}
                    type="button"
                    disabled={missingConfig}
                    title={missingConfig ? 'Configure o escalante e comandante em Configurações' : 'Exportar PDF'}
                  >
                    <FileDown size={14} />
                    PDF
                  </button>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => setViewingId(escala.id)}
                    type="button"
                  >
                    <Eye size={14} />
                    Visualizar
                  </button>
                  {deleteConfirmId === escala.id ? (
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-danger">Confirmar?</span>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(escala.id)}
                        type="button"
                      >
                        Sim
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => setDeleteConfirmId(null)}
                        type="button"
                      >
                        Não
                      </button>
                    </div>
                  ) : (
                    <button
                      className="btn-icon danger"
                      onClick={() => setDeleteConfirmId(escala.id)}
                      title="Excluir"
                      type="button"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
