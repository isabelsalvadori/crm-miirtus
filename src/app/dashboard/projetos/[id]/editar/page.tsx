import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateProjeto } from "../../actions";
import { produtosDoProjeto } from "../../db";
import { ProjetoForm } from "../../_components/projeto-form";

export default async function EditarProjetoPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const [{ data: projeto }, { data: produtosDisponiveis }, produtosVinculados] =
    await Promise.all([
      supabase
        .from("projetos")
        .select("id, nome, descricao, status, prioridade, data_inicio, data_fim_prevista")
        .eq("id", params.id)
        .maybeSingle(),
      supabase.from("produtos").select("id, nome").is("arquivado_em", null).order("nome"),
      produtosDoProjeto(supabase, params.id),
    ]);

  if (!projeto) {
    notFound();
  }

  const action = updateProjeto.bind(null, projeto.id as string);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href={`/dashboard/projetos/${projeto.id}`}
        className="text-sm text-gray-500 transition-colors hover:text-gray-700"
      >
        ← {projeto.nome}
      </Link>

      <h2 className="text-xl font-semibold text-[#24483F]">Editar projeto</h2>

      <div className="rounded-xl border border-black/5 bg-white p-6 shadow-sm">
        <ProjetoForm
          action={action}
          cancelHref={`/dashboard/projetos/${projeto.id}`}
          submitLabel="Salvar alterações"
          produtosDisponiveis={produtosDisponiveis ?? []}
          defaults={{
            nome: projeto.nome ?? "",
            descricao: projeto.descricao ?? "",
            status: projeto.status ?? "",
            prioridade: projeto.prioridade ?? "",
            data_inicio: projeto.data_inicio ?? "",
            data_fim_prevista: projeto.data_fim_prevista ?? "",
            produtoIds: produtosVinculados.map((p) => p.id),
          }}
        />
      </div>
    </div>
  );
}
