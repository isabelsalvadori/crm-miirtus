export type OptionLite = { id: string; nome: string };

export type ConteudoItem = {
  id: string;
  titulo: string;
  tipo: string | null;
  canal: string | null;
  status: string | null;
  pilar: string | null;
  resumo: string | null;
  corpo_roteiro: string | null;
  produto_id: string | null;
  projeto_id: string | null;
  campanha_id: string | null;
  data_agendada: string | null;
  data_publicacao: string | null;
  link_publicado: string | null;
  produto_nome: string | null;
};

export type Catalogos = {
  produtos: OptionLite[];
  projetos: OptionLite[];
  campanhas: OptionLite[];
  eventos: OptionLite[];
};

export type CampanhaItem = {
  id: string;
  nome: string;
  tipo: string | null;
  objetivo: string | null;
  status: string | null;
  canal_principal: string | null;
  orcamento_planejado: number | null;
  gasto_real: number | null;
  receita_gerada: number | null;
  leads: number | null;
  vendas: number | null;
  produto_id: string | null;
  projeto_id: string | null;
  evento_id: string | null;
  periodo_inicio: string | null;
  periodo_fim: string | null;
};

export type AcaoOrganicaItem = {
  id: string;
  nome: string;
  tipo: string | null;
  canal_local: string | null;
  data: string | null;
  status: string | null;
  custo: number | null;
  contatos_gerados: number | null;
  cliques: number | null;
  inscricoes: number | null;
  leads: number | null;
  vendas: number | null;
  receita_atribuida: number | null;
  produto_id: string | null;
  projeto_id: string | null;
  evento_id: string | null;
  campanha_id: string | null;
};
