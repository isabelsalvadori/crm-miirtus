import Link from "next/link";

export default function ProdutoNotFound() {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <h2 className="text-lg font-semibold text-gray-900">
        Produto não encontrado
      </h2>
      <p className="mt-1 text-sm text-gray-500">
        O produto que você procura não existe ou foi removido.
      </p>
      <Link
        href="/dashboard/produtos"
        className="mt-4 inline-block rounded-lg bg-[#24483F] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#1c3a33]"
      >
        Voltar para Produtos
      </Link>
    </div>
  );
}
