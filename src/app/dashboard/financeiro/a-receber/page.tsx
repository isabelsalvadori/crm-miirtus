import {
  MovimentacoesTabPage,
  type MovimentacoesTabPageProps,
} from "../_components/movimentacoes-tab-page";

export default function AReceberPage({
  searchParams,
}: {
  searchParams: MovimentacoesTabPageProps["searchParams"];
}) {
  return (
    <MovimentacoesTabPage
      searchParams={searchParams}
      tipoFixo="receita"
      somentePendentes
      titulo="A Receber"
      novoLabel="+ Nova Receita"
    />
  );
}
