export type OptionLite = { id: string; nome: string };

export type MovAnalytics = {
  id: string;
  tipo: string | null;
  valor: number;
  status: string | null;
  data_competencia: string | null;
  data_pagamento: string | null;
  produto_id: string | null;
  projeto_id: string | null;
};

export type CampanhaAnalytics = {
  id: string;
  nome: string;
  status: string | null;
  orcamento_planejado: number | null;
  gasto_real: number | null;
  receita_gerada: number | null;
  vendas: number | null;
  produto_id: string | null;
  projeto_id: string | null;
};

export type ConteudoAnalytics = {
  id: string;
  canal: string | null;
  status: string | null;
  created_at: string | null;
  data_publicacao: string | null;
  produto_id: string | null;
  projeto_id: string | null;
};

export type MetaAnalytics = {
  id: string;
  nome: string;
  tipo: string | null;
  unidade: string | null;
  valor_alvo: number | null;
  valor_atual: number | null;
  status: string | null;
  periodo_inicio: string | null;
  periodo_fim: string | null;
  produto_id: string | null;
  projeto_id: string | null;
};

export type AnalyticsData = {
  movimentacoes: MovAnalytics[];
  produtos: OptionLite[];
  projetos: OptionLite[];
  campanhas: CampanhaAnalytics[];
  conteudos: ConteudoAnalytics[];
  metas: MetaAnalytics[];
};

export type Intervalo = { inicio: string; fim: string };
