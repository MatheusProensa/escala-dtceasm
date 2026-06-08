import { FileSpreadsheet, FileDown } from 'lucide-react';
import type { Soldado, Escala, TipoQuadrinho } from '../../types';

interface QuadrinhosProps {
  soldados: Soldado[];
  escalas: Escala[];
}

const TIPO_CONFIG: Record<TipoQuadrinho, { label: string; headerBg: string; headerColor: string }> = {
  preta:    { label: 'PRETA',    headerBg: '#111827', headerColor: '#fff' },
  amarela:  { label: 'AMARELA',  headerBg: '#d97706', headerColor: '#000' },
  vermelha: { label: 'VERMELHA', headerBg: '#dc2626', headerColor: '#fff' },
  roxa:     { label: 'ROXA',     headerBg: '#7c3aed', headerColor: '#fff' },
};

// Verde escuro = passado, azul = futuro, amarelo/dourado = hoje, cinza = lastro
const COLORS = {
  past:    { bg: '#16a34a', color: '#fff' },  // verde — serviço já realizado
  today:   { bg: '#f59e0b', color: '#000' },  // dourado — serviço de hoje
  future:  { bg: '#3b82f6', color: '#fff' },  // azul — escalado (futuro)
  lastro:  { bg: '#94a3b8', color: '#fff' },  // cinza — LASTRO
};

type Entry = { display: string; rawDate: string | null; isLastro: boolean };

function shortDate(dateStr: string): string {
  const parts = dateStr.split('-');
  const m = parseInt(parts[1] ?? '1') - 1;
  const d = parts[2] ?? '01';
  const months = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
  return `${d}/${months[m] ?? '?'}`;
}

function buildRows(
  tipo: TipoQuadrinho,
  soldados: Soldado[],
  escalas: Escala[]
): { soldado: Soldado; entries: Entry[]; total: number }[] {
  const activeSoldados = soldados
    .filter(s => s.ativo)
    .sort((a, b) => a.ordemAntiguidade - b.ordemAntiguidade);

  const serviceMap: Record<string, string[]> = {};
  for (const s of activeSoldados) serviceMap[s.id] = [];

  for (const escala of escalas) {
    for (const dia of escala.dias) {
      if (dia.tipoQuadrinho === tipo && dia.soldadoId && serviceMap[dia.soldadoId] !== undefined) {
        serviceMap[dia.soldadoId]!.push(dia.data);
      }
    }
  }
  for (const id in serviceMap) serviceMap[id]!.sort();

  return activeSoldados.map(soldado => {
    const own = serviceMap[soldado.id] ?? [];
    const ownCount = own.length;

    const otherCounts = activeSoldados
      .filter(s => s.id !== soldado.id)
      .map(s => (serviceMap[s.id] ?? []).length);

    const minOthers = otherCounts.length > 0 ? Math.min(...otherCounts) : 0;
    const gap = minOthers - ownCount;
    const lastroCount = gap >= 2 ? Math.floor(gap / 2) : 0;

    const entries: Entry[] = [
      ...Array(lastroCount).fill(null).map((): Entry => ({ display: 'LASTRO', rawDate: null, isLastro: true })),
      ...own.map((d): Entry => ({ display: shortDate(d), rawDate: d, isLastro: false })),
    ];

    return { soldado, entries, total: entries.length };
  });
}

function cellStyle(entry: Entry, today: string): React.CSSProperties {
  if (entry.isLastro) return { backgroundColor: COLORS.lastro.bg, color: COLORS.lastro.color };
  if (entry.rawDate === today) return { backgroundColor: COLORS.today.bg, color: COLORS.today.color, fontWeight: 800, outline: '2px solid #92400e' };
  if (entry.rawDate! < today) return { backgroundColor: COLORS.past.bg, color: COLORS.past.color };
  return { backgroundColor: COLORS.future.bg, color: COLORS.future.color };
}

export default function Quadrinhos({ soldados, escalas }: QuadrinhosProps) {
  const today = new Date().toISOString().split('T')[0]!;
  const tipos: TipoQuadrinho[] = ['preta', 'amarela', 'vermelha', 'roxa'];
  const soldadoLabel = (s: Soldado) => s.patente ? `${s.patente} ${s.nome}` : s.nome;

  if (escalas.length === 0) {
    return (
      <div>
        <div className="page-header">
          <div>
            <div className="page-title">Quadrinhos</div>
            <div className="page-subtitle">Contabilização dos serviços por tipo</div>
          </div>
        </div>
        <div className="empty-state">
          <div className="empty-state-text">Nenhuma escala salva</div>
          <div className="empty-state-sub">Gere e salve escalas para visualizar o quadro de efetivo</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Quadrinhos</div>
          <div className="page-subtitle">Contabilização dos serviços por tipo — histórico completo</div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            className="btn btn-secondary"
            onClick={() => import('../../utils/quadrinhosExport').then(m => m.exportQuadrinhosExcel(soldados, escalas))}
            type="button"
            title="Exportar para Excel"
          >
            <FileSpreadsheet size={15} />
            Excel
          </button>
          <button
            className="btn btn-primary"
            onClick={() => import('../../utils/quadrinhosExport').then(m => m.exportQuadrinhosPdf(soldados, escalas))}
            type="button"
            title="Exportar para PDF"
          >
            <FileDown size={15} />
            PDF
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="card mb-4" style={{ padding: '0.6rem 1rem' }}>
        <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', alignItems: 'center', fontSize: '0.78rem' }}>
          {[
            { color: COLORS.past.bg,   label: 'Realizado' },
            { color: COLORS.today.bg,  label: 'Hoje' },
            { color: COLORS.future.bg, label: 'Escalado (futuro)' },
            { color: COLORS.lastro.bg, label: 'LASTRO' },
          ].map(({ color, label }) => (
            <span key={label} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <span style={{ background: color, width: 12, height: 12, borderRadius: 3, display: 'inline-block', flexShrink: 0 }} />
              {label}
            </span>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {tipos.map(tipo => {
          const cfg = TIPO_CONFIG[tipo];
          const rows = buildRows(tipo, soldados, escalas);
          const maxCols = Math.max(...rows.map(r => r.total), 5);

          return (
            <div key={tipo} className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{
                backgroundColor: cfg.headerBg,
                color: cfg.headerColor,
                fontWeight: 700,
                fontSize: '0.9rem',
                letterSpacing: '0.12em',
                textAlign: 'center',
                padding: '0.5rem 1rem',
              }}>
                {cfg.label}
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ borderCollapse: 'collapse', width: '100%', tableLayout: 'fixed' }}>
                  <colgroup>
                    <col style={{ width: 130 }} />
                    {Array.from({ length: maxCols }, (_, i) => <col key={i} />)}
                  </colgroup>
                  <tbody>
                    {rows.map(({ soldado, entries }, rowIdx) => (
                      <tr key={soldado.id} style={{ backgroundColor: rowIdx % 2 === 0 ? 'var(--bg-surface)' : 'var(--bg-elevated)' }}>
                        <td style={{
                          padding: '4px 10px',
                          fontWeight: 600,
                          fontSize: '0.78rem',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          borderRight: '2px solid var(--border)',
                          width: 130,
                          position: 'sticky',
                          left: 0,
                          backgroundColor: rowIdx % 2 === 0 ? 'var(--bg-surface)' : 'var(--bg-elevated)',
                          zIndex: 1,
                        }}>
                          {soldadoLabel(soldado)}
                        </td>

                        {Array.from({ length: maxCols }, (_, colIdx) => {
                          const entry = entries[colIdx];
                          if (!entry) {
                            return <td key={colIdx} style={{ minWidth: 64, border: '1px solid rgba(0,0,0,0.08)' }} />;
                          }
                          const cs = cellStyle(entry, today);
                          return (
                            <td key={colIdx} style={{
                              padding: '3px 6px',
                              fontSize: '0.72rem',
                              textAlign: 'center',
                              fontWeight: cs.fontWeight ?? 600,
                              border: '1px solid rgba(0,0,0,0.15)',
                              minWidth: 64,
                              fontStyle: entry.isLastro ? 'italic' : 'normal',
                              ...cs,
                            }}>
                              {entry.display}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
