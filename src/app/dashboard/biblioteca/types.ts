export type OptionLite = { id: string; nome: string };

export type TagLite = { id: string; nome: string; cor: string | null };

/** Tag em edição no formulário (ainda sem id quando é nova). */
export type DraftTag = { id?: string; nome: string; cor: string };

export type EntidadeBiblioteca =
  | "biblioteca_produto"
  | "biblioteca_estudo"
  | "biblioteca_acervo";

export type DocumentoItem = {
  id: string;
  titulo: string;
  tipo: string | null;
  descricao: string | null;
  url: string | null;
  entidade_id: string | null;
  pessoa_id: string | null;
  projeto_id: string | null;
  produto_id: string | null;
  fonte: string | null;
  resumo: string | null;
  anotacoes: string | null;
  aplicacoes: string | null;
  tags: TagLite[];
};

export type Catalogos = {
  produtos: OptionLite[];
  projetos: OptionLite[];
  tags: TagLite[];
};
