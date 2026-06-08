import type { Escala, Soldado, Indisponibilidade } from '../types';
import { getDayOfWeek, getMonthName } from './dateUtils';
import { computeQuadrinhos } from './scheduler';

const DAY_ABBREV = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'];

function esc(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function ddmm(dateStr: string): string {
  const [, m, d] = dateStr.split('-');
  return `${d}/${m}`;
}

function militarLabel(soldados: Soldado[], id: string | null): string {
  if (!id) return 'SEM MILITAR';
  const s = soldados.find(x => x.id === id);
  if (!s) return '(removido)';
  return s.patente ? `${s.patente} ${s.nome}` : s.nome;
}

export function generatePrintHtml(
  escala: Escala,
  soldados: Soldado[],
  indisponibilidades: Indisponibilidade[],
  todasEscalas: Escala[],
  escalante: string,
  comandante: string,
): string {
  const { dias, periodo } = escala;
  const D = dias.length;

  const [yearStr, monthStr] = periodo.inicio.split('-');
  const year = parseInt(yearStr ?? '2026');
  const month = parseInt(monthStr ?? '1');
  const mesAno = `${getMonthName(month).toUpperCase()} / ${year}`;

  // Indisponibilidades que se sobrepõem ao período (máx 12 para caber na seção)
  const indispOverlapping = indisponibilidades
    .filter(i => i.dataFim >= periodo.inicio && i.dataInicio <= periodo.fim)
    .slice(0, 12);

  // Ranking da escala de reserva com contagens cumulativas
  const qCounts = computeQuadrinhos(todasEscalas);
  const activeSoldados = soldados.filter(s => s.ativo);

  function getRanking(tipo: 'preta' | 'amarela' | 'vermelha' | 'roxa'): Soldado[] {
    return [...activeSoldados]
      .sort((a, b) => {
        const qa = qCounts[a.id]?.[tipo] ?? 0;
        const qb = qCounts[b.id]?.[tipo] ?? 0;
        if (qa !== qb) return qa - qb;
        return b.ordemAntiguidade - a.ordemAntiguidade;
      })
      .slice(0, 4);
  }

  const rPreta = getRanking('preta');
  const rAmarela = getRanking('amarela');
  const rVermelha = getRanking('vermelha');
  const rRoxa = getRanking('roxa');
  const reservaRows = Math.max(rPreta.length, rAmarela.length, rVermelha.length, rRoxa.length, 1);

  // Posições fixas na coluna direita (índice 1-based)
  const POS_INDISP_HEADER = 1;
  const POS_INDISP_START = 2;
  const POS_RESERVA_BLOCK = 14;  // rowspan=2 covering lines 14 and 15
  const POS_RESERVA_SKIP = 15;   // covered by rowspan — no td on right side
  const POS_RESERVA_EMPTY = 16;
  const POS_TIPO_HEADER = 17;
  const POS_DATA_START = 18;
  const POS_DATA_END = 17 + reservaRows;

  let rowsHtml = '';

  for (let i = 0; i < D; i++) {
    const dia = dias[i]!;
    const dayNum = i + 1;
    const dow = getDayOfWeek(dia.data);
    const dayAbbrev = DAY_ABBREV[dow] ?? '';
    const nomeMilitar = esc(militarLabel(soldados, dia.soldadoId));

    let rowClass = '';
    if (dow === 0 || dow === 6) rowClass = 'weekend';
    else if (dow === 5) rowClass = 'friday';

    let rightHtml = '';

    if (dayNum === POS_INDISP_HEADER) {
      rightHtml = `<td colspan="4" class="ri-header">INDISPONIBILIDADES:</td>`;
    } else if (dayNum >= POS_INDISP_START && dayNum < POS_INDISP_START + indispOverlapping.length) {
      const ind = indispOverlapping[dayNum - POS_INDISP_START]!;
      const sol = soldados.find(s => s.id === ind.soldadoId);
      const solStr = sol ? (sol.patente ? `${sol.patente} ${sol.nome}` : sol.nome) : '(removido)';
      const dStr = `${ddmm(ind.dataInicio)} A ${ddmm(ind.dataFim)}`;
      rightHtml = `<td colspan="4" class="ri-item">${esc(ind.motivo.toUpperCase())}: ${esc(solStr)} (${dStr})</td>`;
    } else if (D >= POS_RESERVA_BLOCK && dayNum === POS_RESERVA_BLOCK) {
      rightHtml = `<td colspan="4" rowspan="2" class="re-block"><div class="re-title">ESCALA DE RESERVA</div><div class="re-sub">*VERIFICAR INDISPONIBILIDADE*</div></td>`;
    } else if (D >= POS_RESERVA_SKIP && dayNum === POS_RESERVA_SKIP) {
      rightHtml = ``; // covered by rowspan from line 14
    } else if (D >= POS_RESERVA_EMPTY && dayNum === POS_RESERVA_EMPTY) {
      rightHtml = `<td colspan="4"></td>`;
    } else if (D >= POS_TIPO_HEADER && dayNum === POS_TIPO_HEADER) {
      rightHtml = `
        <td class="tipo-h">PRETA</td>
        <td class="tipo-h amarela-bg">AMARELA</td>
        <td class="tipo-h vermelha-c">VERMELHA</td>
        <td class="tipo-h">ROXA</td>`;
    } else if (D >= POS_DATA_START && dayNum >= POS_DATA_START && dayNum <= POS_DATA_END) {
      const idx = dayNum - POS_DATA_START;
      const p = rPreta[idx];
      const a = rAmarela[idx];
      const v = rVermelha[idx];
      const r = rRoxa[idx];
      rightHtml = `
        <td class="re-cell">${p ? esc(militarLabel(soldados, p.id)) : ''}</td>
        <td class="re-cell amarela-bg">${a ? esc(militarLabel(soldados, a.id)) : ''}</td>
        <td class="re-cell vermelha-c">${v ? esc(militarLabel(soldados, v.id)) : ''}</td>
        <td class="re-cell">${r ? esc(militarLabel(soldados, r.id)) : ''}</td>`;
    } else {
      rightHtml = `<td colspan="4"></td>`;
    }

    rowsHtml += `
      <tr class="${rowClass}">
        <td class="dn">${String(dayNum).padStart(2, '0')}</td>
        <td class="da">${dayAbbrev}</td>
        <td class="nm">${nomeMilitar}</td>
        ${rightHtml}
      </tr>`;
  }

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Escala ${esc(escala.nome)}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:Arial,Helvetica,sans-serif;background:#fff;font-size:9pt}
table{border-collapse:collapse;width:100%}
td{border:1px solid #000;vertical-align:middle;padding:2px 4px}

/* Cabeçalho */
.h-logo{font-size:11pt;font-weight:bold;text-align:center;vertical-align:middle}
.h-mes-label{text-align:center;font-size:8pt;color:#333;vertical-align:middle}
.h-mes{font-size:14pt;font-weight:bold;text-align:center;vertical-align:middle}
.h-orgao{font-size:7pt;text-align:center;vertical-align:middle;line-height:1.3}
.h-rl{font-size:7pt;color:#333;text-align:center;vertical-align:bottom;padding-bottom:2px;height:18px}
.h-rv{font-size:10pt;font-weight:bold;text-align:center;vertical-align:bottom;padding-bottom:4px;height:44px}

/* Linhas da escala */
tr td{height:17px;font-size:8.5pt}
.dn{width:4%;text-align:center;font-weight:bold}
.da{width:5%;text-align:center}
.nm{width:24%;font-weight:normal}

/* Fim de semana - apenas dia e nome coloridos, nro da linha mantém cor padrão */
.weekend .da,.weekend .nm{color:#cc0000;font-weight:bold}
/* Sexta */
.friday .da,.friday .nm{background-color:#ffffc0;font-weight:bold}

/* Seção direita */
.ri-header{font-weight:bold;font-size:8pt;padding-left:6px}
.ri-item{font-size:8pt;padding-left:6px}
.re-block{text-align:center;vertical-align:middle;font-weight:bold}
.re-block .re-title{font-size:9pt;font-weight:bold;display:block}
.re-block .re-sub{font-size:8pt;font-style:italic;font-weight:normal;display:block}
.tipo-h{font-weight:bold;text-align:center;font-size:8pt;width:16.75%}
.amarela-bg{background-color:#ffffc0}
.vermelha-c{color:#cc0000}
.re-cell{text-align:center;font-size:8pt;width:16.75%}

@media print{
  @page{size:A4 portrait;margin:0.8cm}
  body{font-size:8pt}
  tr td{height:14px}
}
</style>
<script>window.onload=function(){setTimeout(function(){window.print()},400)}</script>
</head>
<body>

<table style="margin-bottom:0">
  <colgroup>
    <col style="width:17%">
    <col style="width:20%">
    <col style="width:63%">
  </colgroup>
  <tr>
    <td rowspan="2" class="h-logo">BASM<br>DTCEA - SM</td>
    <td rowspan="2" class="h-mes-label">ESCALA DO MÊS / ANO:</td>
    <td class="h-rl">ESCALANTE</td>
  </tr>
  <tr>
    <td class="h-rv">${esc(escalante)}</td>
  </tr>
  <tr>
    <td rowspan="2" class="h-orgao">ÓRGÃO<br><strong>PERMANÊNCIA<br>DTCEA-SM</strong></td>
    <td rowspan="2" class="h-mes">${esc(mesAno)}</td>
    <td class="h-rl">COMANDANTE DO DTCEA-SM</td>
  </tr>
  <tr>
    <td class="h-rv">${esc(comandante)}</td>
  </tr>
</table>

<table>
  <colgroup>
    <col style="width:4%">
    <col style="width:5%">
    <col style="width:24%">
    <col style="width:16.75%">
    <col style="width:16.75%">
    <col style="width:16.75%">
    <col style="width:16.75%">
  </colgroup>
  ${rowsHtml}
</table>

</body>
</html>`;
}
