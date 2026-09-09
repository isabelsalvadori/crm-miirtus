import {
  MovimentacoesTabPage,
  type MovimentacoesTabPageProps,
} from "../_components/movimentacoes-tab-page";

export default function DespesasPage({
  searchParams,
}: {
  searchParams: MovimentacoesTabPageProps["searchParams"];
}) {
  return (
    <MovimentacoesTabPage
      searchParams={searchParams}
      tipoFixo="despesa"
      titulo="Despesas"
      novoLabel="+ Nova Despesa"
    />
  );
}
