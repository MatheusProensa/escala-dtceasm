import type { Soldado, Escala, TipoQuadrinho } from '../../types';

interface QuadrinhosProps {
  soldados: Soldado[];
  escalas: Escala[];
}

const TIPO_CONFIG: Record<TipoQuadrinho, { label: string; headerBg: string; headerColor: string; cellBg: string }> = {
  preta:    { label: 'PRETA',    headerBg: '#111827', headerColor: '#fff',    cellBg: '#22c55e' },
  amarela:  { label: 'AMARELA',  headerBg: '#d97706', headerColor: '#000',    cellBg: '#22c55e' },
  vermelha: { label: 'VERMELHA', headerBg: '#dc2626', headerColor: '#fff',    cellBg: '#22c55e' },
  roxa:     { label: 'ROXA',     headerBg: '#7c3aed', headerColor: '#fff',    cellBg: '#22c55e' },
};

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
): { soldado: Soldado; entries: string[]; total: number }[] {
  const activeSoldados = soldados
    .filter(s => s.ativo)
    .sort((a, b) => a.ordemAntiguidade - b.ordemAntiguidade);

  // Collect service dates per soldier for this tipo
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

    // Min count across ALL other soldiers (LASTRO only if behind all)
    const otherCounts = activeSoldados
      .filter(s => s.id !== soldado.id)
      .map(s => (serviceMap[s.id] ?? []).length);

    const minOthers = otherCounts.length > 0 ? Math.min(...otherCounts) : 0;
    const gap = minOthers - ownCount;
    const lastroCount = gap >= 2 ? Math.floor(gap / 2) : 0;

    // LASTRO credits fill earliest empty positions (before real dates)
    const entries: string[] = [
      ...Array(lastroCount).fill('LASTRO'),
      ...own.map(shortDate),
    ];

    return { soldado, entries, total: entries.length };
  });
}

export default function Quadrinhos({ soldados, escalas }: QuadrinhosProps) {
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
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {tipos.map(tipo => {
          const cfg = TIPO_CONFIG[tipo];
          const rows = buildRows(tipo, soldados, escalas);
          const maxCols = Math.max(...rows.map(r => r.total), 1);

          return (
            <div key={tipo} className="card" style={{ padding: 0, overflow: 'hidden' }}>
              {/* Section header */}
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

              {/* Table */}
              <div style={{ overflowX: 'auto' }}>
                <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 400 }}>
                  <tbody>
                    {rows.map(({ soldado, entries }, rowIdx) => (
                      <tr key={soldado.id} style={{ backgroundColor: rowIdx % 2 === 0 ? 'var(--bg-surface)' : 'var(--bg-elevated)' }}>
                        {/* Soldier name — sticky */}
                        <td style={{
                          padding: '4px 10px',
                          fontWeight: 600,
                          fontSize: '0.78rem',
                          whiteSpace: 'nowrap',
                          borderRight: '2px solid var(--border)',
                          minWidth: 140,
                          position: 'sticky',
                          left: 0,
                          backgroundColor: rowIdx % 2 === 0 ? 'var(--bg-surface)' : 'var(--bg-elevated)',
                          zIndex: 1,
                        }}>
                          {soldadoLabel(soldado)}
                        </td>

                        {/* Service entries */}
                        {Array.from({ length: maxCols }, (_, colIdx) => {
                          const entry = entries[colIdx];
                          const hasEntry = entry !== undefined;
                          const isLastro = entry === 'LASTRO';
                          return (
                            <td key={colIdx} style={{
                              padding: '3px 6px',
                              fontSize: '0.72rem',
                              textAlign: 'center',
                              fontWeight: 600,
                              border: '1px solid rgba(0,0,0,0.15)',
                              minWidth: 64,
                              backgroundColor: !hasEntry ? 'transparent' : isLastro ? '#94a3b8' : cfg.cellBg,
                              color: hasEntry ? '#fff' : 'transparent',
                              fontStyle: isLastro ? 'italic' : 'normal',
                            }}>
                              {entry ?? ''}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Legend */}
              <div style={{ padding: '0.4rem 0.75rem', fontSize: '0.7rem', color: 'var(--text-secondary)', borderTop: '1px solid var(--border)', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ background: cfg.cellBg, width: 10, height: 10, borderRadius: 2, display: 'inline-block' }} />
                  Serviço realizado
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ background: '#94a3b8', width: 10, height: 10, borderRadius: 2, display: 'inline-block' }} />
                  LASTRO — crédito por 2+ colunas de defasagem em relação a todos
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
