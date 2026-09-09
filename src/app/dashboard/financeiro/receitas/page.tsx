import {
  MovimentacoesTabPage,
  type MovimentacoesTabPageProps,
} from "../_components/movimentacoes-tab-page";

export default function ReceitasPage({
  searchParams,
}: {
  searchParams: MovimentacoesTabPageProps["searchParams"];
}) {
  return (
    <MovimentacoesTabPage
      searchParams={searchParams}
      tipoFixo="receita"
      titulo="Receitas"
      novoLabel="+ Nova Receita"
    />
  );
}
