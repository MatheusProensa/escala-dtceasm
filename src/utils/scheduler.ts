import type { Soldado, Indisponibilidade, DataEspecial, Escala, EscalaDia, TipoQuadrinho } from '../types';
import { getDayOfWeek, getDaysInRange, parseDate, formatDate } from './dateUtils';

export type QuadrinhoCount = {
  preta: number;
  amarela: number;
  vermelha: number;
  roxa: number;
};

/**
 * Determine the tipo of quadrinho for a given date.
 * Priority: datasEspeciais override > weekend > friday > else preta
 */
export function getTipoQuadrinho(dateStr: string, datasEspeciais: DataEspecial[]): TipoQuadrinho {
  // Check special dates first
  const especial = datasEspeciais.find(d => d.data === dateStr);
  if (especial) return especial.tipo;

  const dow = getDayOfWeek(dateStr);
  if (dow === 0 || dow === 6) return 'vermelha'; // Sunday or Saturday
  if (dow === 5) return 'amarela'; // Friday
  return 'preta'; // Mon-Thu
}

/**
 * Compute total quadrinho counts per soldier from all saved escalas
 */
export function computeQuadrinhos(escalas: Escala[]): Record<string, QuadrinhoCount> {
  const result: Record<string, QuadrinhoCount> = {};

  for (const escala of escalas) {
    for (const dia of escala.dias) {
      if (!dia.soldadoId) continue;
      if (!result[dia.soldadoId]) {
        result[dia.soldadoId] = { preta: 0, amarela: 0, vermelha: 0, roxa: 0 };
      }
      result[dia.soldadoId][dia.tipoQuadrinho]++;
    }
  }

  return result;
}

/**
 * Get service history from all escalas for days before the given date.
 * Returns EscalaDia[] sorted by date ascending.
 */
export function getRecentHistory(escalas: Escala[], beforeDate: string): EscalaDia[] {
  const allDias: EscalaDia[] = [];
  for (const escala of escalas) {
    for (const dia of escala.dias) {
      if (dia.data < beforeDate) {
        allDias.push(dia);
      }
    }
  }
  allDias.sort((a, b) => a.data.localeCompare(b.data));
  return allDias;
}

/**
 * Check if a soldier is unavailable on a given date
 */
function isUnavailable(soldadoId: string, dateStr: string, indisponibilidades: Indisponibilidade[]): boolean {
  return indisponibilidades.some(
    ind =>
      ind.soldadoId === soldadoId &&
      dateStr >= ind.dataInicio &&
      dateStr <= ind.dataFim
  );
}

/**
 * Get the most recent service date for a soldier from history + already-generated days
 */
function getLastServiceDate(
  soldadoId: string,
  beforeDate: string,
  history: EscalaDia[],
  generated: EscalaDia[]
): string | null {
  // Combine history + generated, filter before the given date
  const allDias = [...history, ...generated].filter(
    d => d.soldadoId === soldadoId && d.data < beforeDate
  );

  if (allDias.length === 0) return null;

  // Sort descending and return the most recent
  allDias.sort((a, b) => b.data.localeCompare(a.data));
  return allDias[0]?.data ?? null;
}

/**
 * Calculate day difference between two YYYY-MM-DD strings
 */
function dayDiff(dateA: string, dateB: string): number {
  const a = parseDate(dateA);
  const b = parseDate(dateB);
  const diffMs = b.getTime() - a.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Main scheduling function.
 * Generates an EscalaDia[] for each day in [inicio, fim].
 */
export function gerarEscala(
  inicio: string,
  fim: string,
  soldados: Soldado[],
  indisponibilidades: Indisponibilidade[],
  datasEspeciais: DataEspecial[],
  allPreviousEscalas: Escala[]
): EscalaDia[] {
  // Only active soldiers
  const activeSoldados = soldados.filter(s => s.ativo);

  // Compute starting quadrinho counts from previous escalas
  const quadrinhos = computeQuadrinhos(allPreviousEscalas);

  // Initialize counts for any soldier not yet in the map
  for (const s of activeSoldados) {
    if (!quadrinhos[s.id]) {
      quadrinhos[s.id] = { preta: 0, amarela: 0, vermelha: 0, roxa: 0 };
    }
  }

  // Get history for 48h checks at period boundary
  const history = getRecentHistory(allPreviousEscalas, inicio);

  // Generate days
  const days = getDaysInRange(inicio, fim);
  const generated: EscalaDia[] = [];

  for (const dateStr of days) {
    const tipo = getTipoQuadrinho(dateStr, datasEspeciais);

    // Filter available soldiers (active + not unavailable today)
    const available = activeSoldados.filter(
      s => !isUnavailable(s.id, dateStr, indisponibilidades)
    );

    if (available.length === 0) {
      generated.push({
        data: dateStr,
        tipoQuadrinho: tipo,
        soldadoId: null,
        excepcionouIntervalo: false,
      });
      continue;
    }

    // Vermelha (SAB/DOM) e roxa (feriados) são prioridade máxima — sem regra de 48h.
    // Amarela (SEX) também é prioridade — sem regra de 48h.
    // Preta (Seg-Qui) respeita a regra de 48h (≥3 dias desde o último serviço).
    let candidatos: typeof available;
    let excepcionouIntervalo = false;

    if (tipo === 'vermelha' || tipo === 'amarela' || tipo === 'roxa') {
      // Prioridade alta: ignora intervalo, pega quem tem menos desse tipo
      candidatos = available;
    } else {
      // Preta: aplica regra de 48h
      const preferred = available.filter(s => {
        const lastService = getLastServiceDate(s.id, dateStr, history, generated);
        if (!lastService) return true;
        const diff = dayDiff(lastService, dateStr);
        return diff >= 3;
      });
      candidatos = preferred.length > 0 ? preferred : available;
      excepcionouIntervalo = preferred.length === 0 && available.length > 0;
    }

    // Sort: fewer quadrinhos of this tipo first, then more junior (lower ordemAntiguidade) first
    const sorted = [...candidatos].sort((a, b) => {
      const qa = quadrinhos[a.id] ?? { preta: 0, amarela: 0, vermelha: 0, roxa: 0 };
      const qb = quadrinhos[b.id] ?? { preta: 0, amarela: 0, vermelha: 0, roxa: 0 };
      const countA = qa[tipo];
      const countB = qb[tipo];

      if (countA !== countB) return countA - countB; // fewer quadrinhos first

      // Tie-breaker: most modern (higher ordemAntiguidade) first
      return b.ordemAntiguidade - a.ordemAntiguidade;
    });

    const chosen = sorted[0];
    if (!chosen) {
      generated.push({
        data: dateStr,
        tipoQuadrinho: tipo,
        soldadoId: null,
        excepcionouIntervalo: false,
      });
      continue;
    }

    // Update running counts
    if (!quadrinhos[chosen.id]) {
      quadrinhos[chosen.id] = { preta: 0, amarela: 0, vermelha: 0, roxa: 0 };
    }
    quadrinhos[chosen.id][tipo]++;

    generated.push({
      data: dateStr,
      tipoQuadrinho: tipo,
      soldadoId: chosen.id,
      excepcionouIntervalo,
    });
  }

  return generated;
}

/**
 * Compute quadrinho counts for a specific set of EscalaDia[] (for previews)
 */
export function computeQuadrinhosFromDias(dias: EscalaDia[]): Record<string, QuadrinhoCount> {
  const result: Record<string, QuadrinhoCount> = {};
  for (const dia of dias) {
    if (!dia.soldadoId) continue;
    if (!result[dia.soldadoId]) {
      result[dia.soldadoId] = { preta: 0, amarela: 0, vermelha: 0, roxa: 0 };
    }
    result[dia.soldadoId][dia.tipoQuadrinho]++;
  }
  return result;
}

/**
 * Get a default start date for the next month
 */
export function getNextMonthStart(): string {
  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return formatDate(next);
}

/**
 * Get a default end date for the next month
 */
export function getNextMonthEnd(): string {
  const now = new Date();
  const nextEnd = new Date(now.getFullYear(), now.getMonth() + 2, 0); // last day of next month
  return formatDate(nextEnd);
}
