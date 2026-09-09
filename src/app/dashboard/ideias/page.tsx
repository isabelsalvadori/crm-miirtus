import { createClient } from "@/lib/supabase/server";
import type { Ideia } from "./actions";
import { IdeiasList } from "./components/IdeiasList";

export default async function IdeiasPage() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("ideias")
    .select(
      "id, titulo, descricao, status, categoria, impacto, esforco, created_at, updated_at, arquivado_em",
    )
    .is("arquivado_em", null)
    .order("created_at", { ascending: false });

  const ideias = (data ?? []) as Ideia[];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {error ? (
        <div className="rounded-xl border border-black/5 bg-white p-6 text-sm text-red-600 shadow-sm">
          Não foi possível carregar as ideias. Recarregue a página.
        </div>
      ) : (
        <IdeiasList ideias={ideias} />
      )}
    </div>
  );
}
