export type TagLite = { id: string; nome: string; cor: string | null };

export type OptionLite = { id: string; nome: string };

export type ContextoLink = { tipo: "produto" | "projeto"; nome: string } | null;

export type TarefaListItem = {
  id: string;
  titulo: string;
  status: string | null;
  prioridade: string | null;
  data_prazo: string | null;
  projeto_id: string | null;
  produto_id: string | null;
  tags: TagLite[];
  contexto: ContextoLink;
};

export type TarefaFull = {
  id: string;
  titulo: string;
  descricao: string | null;
  observacoes: string | null;
  status: string | null;
  prioridade: string | null;
  data_prazo: string | null;
  data_conclusao: string | null;
  projeto_id: string | null;
  produto_id: string | null;
  na_agenda: boolean | null;
  agenda_inicio: string | null;
  agenda_fim: string | null;
  tags: TagLite[];
  contexto: ContextoLink;
};

export type SubtarefaItem = {
  id: string;
  titulo: string;
  status: string | null;
};
