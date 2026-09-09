import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createProjeto } from "../actions";
import { ProjetoForm } from "../_components/projeto-form";

export default async function NovoProjetoPage() {
  const supabase = createClient();
  const { data: produtos } = await supabase
    .from("produtos")
    .select("id, nome")
    .is("arquivado_em", null)
    .order("nome");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href="/dashboard/projetos"
        className="text-sm text-gray-500 transition-colors hover:text-gray-700"
      >
        ← Projetos
      </Link>

      <div>
        <h2 className="text-xl font-semibold text-[#24483F]">Novo projeto</h2>
        <p className="mt-1 text-sm text-gray-500">
          Apenas o nome é obrigatório.
        </p>
      </div>

      <div className="rounded-xl border border-black/5 bg-white p-6 shadow-sm">
        <ProjetoForm
          action={createProjeto}
          cancelHref="/dashboard/projetos"
          submitLabel="Salvar"
          produtosDisponiveis={produtos ?? []}
        />
      </div>
    </div>
  );
}
