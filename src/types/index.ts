export type TipoQuadrinho = 'preta' | 'amarela' | 'vermelha' | 'roxa';

export interface Soldado {
  id: string;
  nome: string;
  patente: string;
  ordemAntiguidade: number; // 1 = most senior/antigo, higher = more modern/júnior (higher = preferred for service)
  ativo: boolean;
}

export interface Indisponibilidade {
  id: string;
  soldadoId: string;
  dataInicio: string; // YYYY-MM-DD
  dataFim: string;    // YYYY-MM-DD
  motivo: string;
}

export interface DataEspecial {
  id: string;
  data: string; // YYYY-MM-DD
  tipo: TipoQuadrinho;
  descricao: string;
}

export interface EscalaDia {
  data: string; // YYYY-MM-DD
  tipoQuadrinho: TipoQuadrinho;
  soldadoId: string | null;
  excepcionouIntervalo: boolean;
}

export interface Escala {
  id: string;
  nome: string;
  periodo: { inicio: string; fim: string };
  dias: EscalaDia[];
  geradaEm: string;
}

export type Tela = 'soldados' | 'indisponibilidade' | 'datas-especiais' | 'gerar' | 'historico';

export interface AppData {
  soldados: Soldado[];
  indisponibilidades: Indisponibilidade[];
  datasEspeciais: DataEspecial[];
  escalas: Escala[];
}
