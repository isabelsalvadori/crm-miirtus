export type OptionLite = { id: string; nome: string };

export type ProgressoInfo = {
  concluidas: number;
  total: number;
  percentual: number;
};

export type ProjetoListItem = {
  id: string;
  nome: string;
  status: string | null;
  prioridade: string | null;
  data_inicio: string | null;
  data_fim_prevista: string | null;
  progresso: ProgressoInfo;
  produtos: OptionLite[];
};

export type ProjetoFull = {
  id: string;
  nome: string;
  descricao: string | null;
  status: string | null;
  prioridade: string | null;
  data_inicio: string | null;
  data_fim_prevista: string | null;
  data_fim_real: string | null;
  arquivado_em: string | null;
};

export type FaseItem = {
  id: string;
  nome: string;
  status: string | null;
  ordem: number;
};
