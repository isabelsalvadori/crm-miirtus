export type OptionLite = { id: string; nome: string };

export type CategoriaLite = {
  id: string;
  nome: string;
  tipo: string | null;
  cor: string | null;
};

export type CategoriaItem = CategoriaLite & {
  descricao: string | null;
  ordem: number;
  arquivado_em: string | null;
};

export type ContextoLink = { tipo: "produto" | "projeto"; nome: string } | null;

/** Registro de `movimentacoes_financeiras` — serve tanto a listagem quanto o modal. */
export type MovimentacaoFull = {
  id: string;
  descricao: string;
  tipo: string | null;
  valor: number;
  status: string | null;
  data_competencia: string | null;
  data_vencimento: string | null;
  data_pagamento: string | null;
  categoria_id: string | null;
  categoria: CategoriaLite | null;
  produto_id: string | null;
  projeto_id: string | null;
  forma_pagamento: string | null;
  comprovante_url: string | null;
  observacoes: string | null;
  contexto: ContextoLink;
};

export type ResumoMes = {
  receitas: number;
  despesas: number;
  resultado: number;
  receitasAnterior: number;
  despesasAnterior: number;
  resultadoAnterior: number;
};

export type FluxoCaixaMes = {
  chave: string;
  label: string;
  receitasPrevistas: number;
  despesasPrevistas: number;
  saldoProjetado: number;
  receitasRealizadas: number;
  despesasRealizadas: number;
  saldoReal: number;
};
