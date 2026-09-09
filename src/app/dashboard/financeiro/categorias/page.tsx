import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { OK_MESSAGES } from "../constants";
import type { CategoriaItem } from "../types";
import { CategoriasManager } from "../_components/categorias-manager";
import { Toast } from "../_components/toast";

export default async function CategoriasFinanceiroPage({
  searchParams,
}: {
  searchParams: { ok?: string };
}) {
  const supabase = createClient();
  const { data } = await supabase
    .from("categorias_financeiras")
    .select("id, nome, tipo, cor, descricao, ordem, arquivado_em")
    .is("arquivado_em", null)
    .order("ordem", { ascending: true })
    .order("nome", { ascending: true });

  const categorias = (data ?? []) as CategoriaItem[];
  const categoriasReceita = categorias.filter((c) => c.tipo === "receita");
  const categoriasDespesa = categorias.filter((c) => c.tipo === "despesa");
  const okMessage = searchParams.ok ? OK_MESSAGES[searchParams.ok] ?? null : null;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link
        href="/dashboard/financeiro"
        className="text-sm text-gray-500 transition-colors hover:text-gray-700"
      >
        ← Financeiro
      </Link>

      <div>
        <h2 className="text-xl font-semibold text-[#24483F]">Categorias financeiras</h2>
        <p className="mt-1 text-sm text-gray-500">
          Usadas para classificar receitas e despesas nos formulários e filtros.
        </p>
      </div>

      {okMessage && <Toast message={okMessage} />}

      <CategoriasManager
        categoriasReceita={categoriasReceita}
        categoriasDespesa={categoriasDespesa}
      />
    </div>
  );
}
