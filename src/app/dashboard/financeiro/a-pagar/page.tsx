import {
  MovimentacoesTabPage,
  type MovimentacoesTabPageProps,
} from "../_components/movimentacoes-tab-page";

export default function APagarPage({
  searchParams,
}: {
  searchParams: MovimentacoesTabPageProps["searchParams"];
}) {
  return (
    <MovimentacoesTabPage
      searchParams={searchParams}
      tipoFixo="despesa"
      somentePendentes
      titulo="A Pagar"
      novoLabel="+ Nova Despesa"
    />
  );
}
