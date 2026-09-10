/** Tipos enxutos das seções de perfil (Clientes, Produtos, Projetos). */

export type NotaLite = {
  id: string;
  titulo: string | null;
  conteudo: string | null;
  created_at: string;
};

export type TarefaLite = {
  id: string;
  titulo: string;
  status: string | null;
  prioridade: string | null;
  data_prazo: string | null;
};

export type MovimentacaoLite = {
  id: string;
  descricao: string;
  tipo: string | null;
  valor: number;
  data_competencia: string | null;
};

export type MetaLite = {
  id: string;
  nome: string;
  tipo: string | null;
  valor_atual: number | null;
  valor_alvo: number | null;
  unidade: string | null;
  periodo_inicio: string | null;
  periodo_fim: string | null;
  status: string | null;
};
