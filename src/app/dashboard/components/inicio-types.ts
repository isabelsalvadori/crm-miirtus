export type TarefaLite = {
  id: string;
  titulo: string;
  status: string | null;
  data_prazo: string | null;
  projeto_id: string | null;
};

export type CompromissoLite = {
  id: string;
  titulo: string;
  hora: string | null;
};

export type MovLite = {
  tipo: string | null;
  valor: number;
  status: string | null;
  data_competencia: string | null;
};

export type MetaLite = {
  id: string;
  nome: string;
  tipo: string | null;
  unidade: string | null;
  valor_alvo: number | null;
  valor_atual: number | null;
  periodo_inicio: string | null;
  periodo_fim: string | null;
};

export type ProjetoLite = {
  id: string;
  nome: string;
  status: string | null;
  progresso: number | null;
};

export type FaseLite = {
  projeto_id: string;
  nome: string;
  status: string | null;
  ordem: number;
};

export type ConteudoLite = {
  id: string;
  titulo: string;
  canal: string | null;
  data_agendada: string | null;
};

export type CampanhaLite = {
  id: string;
  nome: string;
  canal: string | null;
  orcamento_planejado: number | null;
  gasto_real: number | null;
};

export type RecenteLite = {
  id: string;
  titulo: string;
  tipo: "tarefa" | "projeto" | "produto";
  updated_at: string | null;
};

export type DashboardData = {
  hoje: string; // YYYY-MM-DD no fuso America/Sao_Paulo
  hora: number; // hora local (0-23) em America/Sao_Paulo
  tarefas: TarefaLite[];
  compromissos: CompromissoLite[];
  movimentacoes: MovLite[];
  metas: MetaLite[];
  projetos: ProjetoLite[];
  fases: FaseLite[];
  conteudos: ConteudoLite[];
  campanhas: CampanhaLite[];
  recentes: RecenteLite[];
  falhas: string[];
};
