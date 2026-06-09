import type { Soldado, Indisponibilidade, DataEspecial, Escala, EscalaDia, TipoQuadrinho } from '../types';
import { getDayOfWeek, getDaysInRange, parseDate, formatDate } from './dateUtils';

function addDays(dateStr: string, n: number): string {
  const d = parseDate(dateStr);
  d.setDate(d.getDate() + n);
  return formatDate(d);
}

export type QuadrinhoCount = {
  preta: number;
  amarela: number;
  vermelha: number;
  roxa: number;
};

/**
 * Determine the tipo of quadrinho for a given date.
 *
 * Rules:
 * - Feriado cadastrado (Vermelha/Roxa) → usa o tipo cadastrado
 * - Sábado/Domingo → Vermelha
 * - Sexta → Amarela (véspera do fim de semana)
 * - Quinta → Amarela SOMENTE se sexta for feriado (véspera sobe pra quinta)
 * - Quarta → Amarela SOMENTE se quinta E sexta forem feriado (feriadão)
 * - Demais → Preta
 */
export function getTipoQuadrinho(dateStr: string, datasEspeciais: DataEspecial[]): TipoQuadrinho {
  const especial = datasEspeciais.find(d => d.data === dateStr);
  if (especial) return especial.tipo;

  const dow = getDayOfWeek(dateStr);

  if (dow === 0 || dow === 6) return 'vermelha';
  if (dow === 5) return 'amarela';

  if (dow === 4) {
    // Quinta → Amarela se sexta for feriado
    const sexta = addDays(dateStr, 1);
    if (datasEspeciais.some(d => d.data === sexta)) return 'amarela';
  }

  if (dow === 3) {
    // Quarta → Amarela somente se quinta E sexta forem feriado
    const quinta = addDays(dateStr, 1);
    const sexta = addDays(dateStr, 2);
    if (datasEspeciais.some(d => d.data === quinta) && datasEspeciais.some(d => d.data === sexta)) {
      return 'amarela';
    }
  }

  return 'preta';
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
  const activeSoldados = soldados.filter(s => s.ativo);
  const quadrinhos = computeQuadrinhos(allPreviousEscalas);
  for (const s of activeSoldados) {
    if (!quadrinhos[s.id]) {
      quadrinhos[s.id] = { preta: 0, amarela: 0, vermelha: 0, roxa: 0 };
    }
  }

  // History: dias servidos ANTES do período (para checar intervalo na fronteira)
  const history = getRecentHistory(allPreviousEscalas, inicio);

  const days = getDaysInRange(inicio, fim);

  // Prioridade de tipo: roxa=0, vermelha=1, amarela=2, preta=3
  // Processar dias na ordem de prioridade do tipo, não cronológica.
  // Dentro do mesmo tipo, ordem cronológica.
  const PRIO: Record<TipoQuadrinho, number> = { roxa: 0, vermelha: 1, amarela: 2, preta: 3 };

  const daysSorted = days
    .map(d => ({ data: d, tipo: getTipoQuadrinho(d, datasEspeciais) }))
    .sort((a, b) => {
      const dp = PRIO[a.tipo] - PRIO[b.tipo];
      return dp !== 0 ? dp : a.data.localeCompare(b.data);
    });

  // Mapa de atribuições: data → soldadoId (construído na ordem de prioridade)
  const assignments = new Map<string, string | null>();
  const excMap = new Map<string, boolean>();

  // Intervalo mínimo entre dois serviços do mesmo militar (|diff| >= 2).
  // A checagem é bidirecional: ao atribuir uma data, verifica todos os dias já
  // atribuídos (passados e futuros na escala), pois os dias são processados por
  // prioridade de tipo — não em ordem cronológica — e um serviço futuro pode já
  // estar atribuído.
  function minGapForSoldier(soldadoId: string, dateStr: string): number {
    let min = Infinity;
    // Histórico pré-período (apenas backward)
    const lastHist = getLastServiceDate(soldadoId, dateStr, history, []);
    if (lastHist) min = Math.min(min, dayDiff(lastHist, dateStr));
    // Atribuições já feitas neste período (forward e backward)
    for (const [d, id] of assignments) {
      if (id === soldadoId) {
        min = Math.min(min, Math.abs(dayDiff(d, dateStr)));
      }
    }
    return min;
  }

  for (const { data: dateStr, tipo } of daysSorted) {
    const available = activeSoldados.filter(
      s => !isUnavailable(s.id, dateStr, indisponibilidades)
    );

    if (available.length === 0) {
      assignments.set(dateStr, null);
      excMap.set(dateStr, false);
      continue;
    }

    // Pool preferencial: ≥2 dias de folga entre serviços (diff >= 3)
    // Fallback:         ≥1 dia de folga (diff >= 2) — último recurso
    // Emergência:       dias consecutivos — marca exceção
    const withGoodRest = available.filter(s => minGapForSoldier(s.id, dateStr) >= 3);
    const withMinRest  = available.filter(s => minGapForSoldier(s.id, dateStr) >= 2);
    const candidatos = withGoodRest.length > 0 ? withGoodRest
      : withMinRest.length > 0 ? withMinRest
      : available;
    const excepcionouIntervalo = withMinRest.length === 0 && available.length > 0;

    // Ordenação: 1) menos quadrinhos do tipo, 2) mais moderno (maior ordemAntiguidade)
    const chosen = [...candidatos].sort((a, b) => {
      const qa = quadrinhos[a.id]?.[tipo] ?? 0;
      const qb = quadrinhos[b.id]?.[tipo] ?? 0;
      if (qa !== qb) return qa - qb;
      return b.ordemAntiguidade - a.ordemAntiguidade;
    })[0];

    assignments.set(dateStr, chosen?.id ?? null);
    excMap.set(dateStr, excepcionouIntervalo);

    if (chosen) {
      if (!quadrinhos[chosen.id]) {
        quadrinhos[chosen.id] = { preta: 0, amarela: 0, vermelha: 0, roxa: 0 };
      }
      quadrinhos[chosen.id][tipo]++;
    }
  }

  // Retornar em ordem cronológica
  return days.map(dateStr => ({
    data: dateStr,
    tipoQuadrinho: getTipoQuadrinho(dateStr, datasEspeciais),
    soldadoId: assignments.get(dateStr) ?? null,
    excepcionouIntervalo: excMap.get(dateStr) ?? false,
  }));
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
