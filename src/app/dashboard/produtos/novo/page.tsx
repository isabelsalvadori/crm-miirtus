import Link from "next/link";
import { createProduto } from "../actions";
import { ProdutoForm } from "../_components/produto-form";

export default function NovoProdutoPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href="/dashboard/produtos"
        className="text-sm text-gray-500 transition-colors hover:text-gray-700"
      >
        ← Produtos
      </Link>

      <div>
        <h2 className="text-xl font-semibold text-[#24483F]">Novo produto</h2>
        <p className="mt-1 text-sm text-gray-500">
          Apenas o nome é obrigatório.
        </p>
      </div>

      <div className="rounded-xl border border-black/5 bg-white p-6 shadow-sm">
        <ProdutoForm
          action={createProduto}
          cancelHref="/dashboard/produtos"
          submitLabel="Salvar"
        />
      </div>
    </div>
  );
}
