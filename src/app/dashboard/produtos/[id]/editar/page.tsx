import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateProduto } from "../../actions";
import { ProdutoForm } from "../../_components/produto-form";

export default async function EditarProdutoPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const { data: produto } = await supabase
    .from("produtos")
    .select("id, nome, slug, tipo, status, modelo_acesso, preco, descricao")
    .eq("id", params.id)
    .maybeSingle();

  if (!produto) {
    notFound();
  }

  const action = updateProduto.bind(null, produto.id as string);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href={`/dashboard/produtos/${produto.id}`}
        className="text-sm text-gray-500 transition-colors hover:text-gray-700"
      >
        ← {produto.nome}
      </Link>

      <h2 className="text-xl font-semibold text-[#24483F]">Editar produto</h2>

      <div className="rounded-xl border border-black/5 bg-white p-6 shadow-sm">
        <ProdutoForm
          action={action}
          cancelHref={`/dashboard/produtos/${produto.id}`}
          submitLabel="Salvar alterações"
          defaults={{
            nome: produto.nome ?? "",
            slug: produto.slug ?? "",
            tipo: produto.tipo ?? "",
            status: produto.status ?? "",
            modelo_acesso: produto.modelo_acesso ?? "",
            preco:
              produto.preco !== null && produto.preco !== undefined
                ? String(produto.preco)
                : "",
            descricao: produto.descricao ?? "",
          }}
        />
      </div>
    </div>
  );
}
