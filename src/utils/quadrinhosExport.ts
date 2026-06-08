import * as XLSX from 'xlsx';
import type { Soldado, Escala, TipoQuadrinho } from '../types';

const TIPO_LABELS: Record<TipoQuadrinho, string> = {
  preta: 'PRETA',
  amarela: 'AMARELA',
  vermelha: 'VERMELHA',
  roxa: 'ROXA',
};

function esc(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function shortDate(dateStr: string): string {
  const parts = dateStr.split('-');
  const m = parseInt(parts[1] ?? '1') - 1;
  const d = parts[2] ?? '01';
  const months = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
  return `${d}/${months[m] ?? '?'}`;
}

interface RowData {
  soldado: Soldado;
  dates: string[];
  lastroCount: number;
}

function buildRowData(tipo: TipoQuadrinho, soldados: Soldado[], escalas: Escala[]): RowData[] {
  const active = soldados.filter(s => s.ativo).sort((a, b) => a.ordemAntiguidade - b.ordemAntiguidade);
  const serviceMap: Record<string, string[]> = {};
  for (const s of active) serviceMap[s.id] = [];

  for (const escala of escalas) {
    for (const dia of escala.dias) {
      if (dia.tipoQuadrinho === tipo && dia.soldadoId && serviceMap[dia.soldadoId] !== undefined) {
        serviceMap[dia.soldadoId]!.push(dia.data);
      }
    }
  }
  for (const id in serviceMap) serviceMap[id]!.sort();

  return active.map(soldado => {
    const own = serviceMap[soldado.id] ?? [];
    const otherCounts = active.filter(s => s.id !== soldado.id).map(s => (serviceMap[s.id] ?? []).length);
    const minOthers = otherCounts.length > 0 ? Math.min(...otherCounts) : 0;
    const gap = minOthers - own.length;
    const lastroCount = gap >= 2 ? Math.floor(gap / 2) : 0;
    return { soldado, dates: own, lastroCount };
  });
}

// ─── EXCEL EXPORT ────────────────────────────────────────────────────────────

export function exportQuadrinhosExcel(soldados: Soldado[], escalas: Escala[]): void {
  const wb = XLSX.utils.book_new();
  const tipos: TipoQuadrinho[] = ['preta', 'amarela', 'vermelha', 'roxa'];

  for (const tipo of tipos) {
    const rows = buildRowData(tipo, soldados, escalas);
    const maxDates = Math.max(...rows.map(r => r.dates.length + r.lastroCount), 0);

    const header = ['Militar', 'Total'];
    for (let i = 1; i <= maxDates; i++) header.push(`Serv. ${i}`);

    const sheetData: (string | number)[][] = [header];

    for (const { soldado, dates, lastroCount } of rows) {
      const label = soldado.patente ? `${soldado.patente} ${soldado.nome}` : soldado.nome;
      const total = dates.length + lastroCount;
      const row: (string | number)[] = [label, total];
      for (let i = 0; i < lastroCount; i++) row.push('LASTRO');
      for (const d of dates) row.push(shortDate(d));
      sheetData.push(row);
    }

    const ws = XLSX.utils.aoa_to_sheet(sheetData);
    ws['!cols'] = [{ wch: 28 }, { wch: 8 }, ...Array(maxDates).fill({ wch: 12 })];
    XLSX.utils.book_append_sheet(wb, ws, TIPO_LABELS[tipo]);
  }

  XLSX.writeFile(wb, `Quadrinhos_DTCEASM_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

// ─── PDF (PRINT HTML) ────────────────────────────────────────────────────────

function buildTableHtml(tipo: TipoQuadrinho, rows: RowData[], today: string, maxCols: number): string {
  const cfg: Record<TipoQuadrinho, { bg: string; color: string }> = {
    preta:    { bg: '#111827', color: '#fff' },
    amarela:  { bg: '#eab308', color: '#000' },
    vermelha: { bg: '#dc2626', color: '#fff' },
    roxa:     { bg: '#7c3aed', color: '#fff' },
  };
  const c = cfg[tipo];

  const colgroup = `<colgroup><col style="width:125px">${Array(maxCols).fill('<col style="width:60px">').join('')}</colgroup>`;

  let tbody = '';
  rows.forEach(({ soldado, dates, lastroCount }, idx) => {
    const label = soldado.patente ? `${soldado.patente} ${soldado.nome}` : soldado.nome;
    const rowBg = idx % 2 === 0 ? '#fff' : '#f5f5f5';
    let cells = `<td class="nm" style="background:${rowBg};width:125px">${esc(label)}</td>`;

    const entries: { display: string; rawDate: string | null; isLastro: boolean }[] = [
      ...Array(lastroCount).fill(null).map(() => ({ display: 'LASTRO', rawDate: null, isLastro: true })),
      ...dates.map(d => ({ display: shortDate(d), rawDate: d, isLastro: false })),
    ];

    for (let col = 0; col < maxCols; col++) {
      const entry = entries[col];
      if (!entry) {
        cells += `<td class="dc empty"></td>`;
        continue;
      }
      let bg = '#3b82f6'; let color = '#fff'; let fw = '600'; let outline = '';
      if (entry.isLastro) { bg = '#94a3b8'; color = '#fff'; }
      else if (entry.rawDate === today) { bg = '#f59e0b'; color = '#000'; fw = '800'; outline = 'outline:2px solid #92400e;'; }
      else if (entry.rawDate! < today) { bg = '#16a34a'; color = '#fff'; }
      cells += `<td class="dc" style="background:${bg};color:${color};font-weight:${fw};${outline}">${entry.display}</td>`;
    }

    tbody += `<tr>${cells}</tr>`;
  });

  return `
    <div class="tipo-block">
      <div class="tipo-header" style="background:${c.bg};color:${c.color}">${TIPO_LABELS[tipo]}</div>
      <div class="table-wrap">
        <table style="table-layout:fixed">
          ${colgroup}
          <tbody>${tbody}</tbody>
        </table>
      </div>
    </div>`;
}

export function exportQuadrinhosPdf(soldados: Soldado[], escalas: Escala[]): void {
  const today = new Date().toISOString().split('T')[0]!;
  const dataGeracao = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  const tipos: TipoQuadrinho[] = ['preta', 'amarela', 'vermelha', 'roxa'];

  const allRows = tipos.map(tipo => ({ tipo, rows: buildRowData(tipo, soldados, escalas) }));
  const globalMaxCols = Math.max(...allRows.flatMap(({ rows }) => rows.map(r => r.dates.length + r.lastroCount)), 5);

  const tablesHtml = allRows.map(({ tipo, rows }) => {
    return buildTableHtml(tipo, rows, today, globalMaxCols);
  }).join('');

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Quadrinhos — DTCEA-SM</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:Arial,Helvetica,sans-serif;background:#fff;color:#000;font-size:9pt}

/* ── Cabeçalho ── */
.page-header{display:flex;align-items:center;justify-content:space-between;border-bottom:3px solid #1e40af;padding-bottom:8px;margin-bottom:14px}
.org-block{display:flex;flex-direction:column;gap:2px}
.org-title{font-size:13pt;font-weight:800;letter-spacing:.08em;color:#1e3a8a}
.org-sub{font-size:8pt;color:#374151;letter-spacing:.04em}
.doc-block{text-align:right}
.doc-title{font-size:11pt;font-weight:700;color:#1e3a8a}
.doc-date{font-size:8pt;color:#6b7280;margin-top:2px}

/* ── Legenda ── */
.legend{display:flex;gap:14px;flex-wrap:wrap;align-items:center;font-size:8pt;margin-bottom:12px;padding:5px 8px;border:1px solid #e5e7eb;border-radius:4px;background:#fafafa}
.leg-item{display:inline-flex;align-items:center;gap:5px}
.leg-swatch{display:inline-block;width:11px;height:11px;border-radius:2px;flex-shrink:0}

/* ── Blocos por tipo ── */
.tipo-block{margin-bottom:12px;border:1px solid #d1d5db;border-radius:4px;overflow:hidden;page-break-inside:avoid}
.tipo-header{font-weight:800;font-size:9pt;letter-spacing:.14em;text-align:center;padding:4px 10px}
.table-wrap{overflow-x:auto}

/* ── Tabela ── */
table{border-collapse:collapse;width:100%}
td{border:1px solid rgba(0,0,0,.12);vertical-align:middle;padding:2px 4px;white-space:nowrap}
.nm{font-size:8pt;font-weight:600;width:125px;min-width:125px;max-width:125px;padding:2px 8px;overflow:hidden;white-space:nowrap;border-right:2px solid #9ca3af}
.dc{font-size:7.5pt;text-align:center;min-width:52px}
.dc.empty{background:#fff}

/* ── Rodapé ── */
.footer{margin-top:10px;font-size:7pt;color:#9ca3af;text-align:right;border-top:1px solid #e5e7eb;padding-top:6px}

@media print{
  *{-webkit-print-color-adjust:exact !important;print-color-adjust:exact !important}
  @page{size:A4 landscape;margin:1cm}
  body{font-size:8pt}
  .tipo-block{page-break-inside:avoid}
}
</style>
<script>window.onload=function(){setTimeout(function(){window.print()},500)}</script>
</head>
<body>

<div class="page-header">
  <div class="org-block">
    <div class="org-title">BASM · DTCEA-SM</div>
    <div class="org-sub">DESTACAMENTO DE CONTROLE DO ESPAÇO AÉREO DE SANTA MARIA</div>
  </div>
  <div class="doc-block">
    <div class="doc-title">QUADRINHOS DE SERVIÇO</div>
    <div class="doc-date">Emitido em ${esc(dataGeracao)}</div>
  </div>
</div>

<div class="legend">
  <span style="font-weight:700;color:#374151;margin-right:4px">Legenda:</span>
  <span class="leg-item"><span class="leg-swatch" style="background:#16a34a"></span>Realizado</span>
  <span class="leg-item"><span class="leg-swatch" style="background:#f59e0b;outline:2px solid #92400e"></span>Hoje</span>
  <span class="leg-item"><span class="leg-swatch" style="background:#3b82f6"></span>Escalado (futuro)</span>
  <span class="leg-item"><span class="leg-swatch" style="background:#94a3b8"></span>LASTRO</span>
</div>

${tablesHtml}

<div class="footer">Gerado pelo Sistema de Escala de Serviço — DTCEA-SM · RCA 34-1/2005</div>

</body>
</html>`;

  const win = window.open('', '_blank', 'width=1100,height=800');
  if (!win) { alert('Permita pop-ups para gerar o PDF.'); return; }
  win.document.write(html);
  win.document.close();
}
