import { createClient } from "@/lib/supabase/server";
import type { ConvertivelTipo, Ideia } from "./actions";
import { IdeiasList } from "./components/IdeiasList";

const TABELA_CONVERSAO: Record<
  ConvertivelTipo,
  { tabela: string; coluna: "nome" | "titulo" }
> = {
  projeto: { tabela: "projetos", coluna: "nome" },
  produto: { tabela: "produtos", coluna: "nome" },
  evento: { tabela: "eventos", coluna: "nome" },
  conteudo: { tabela: "conteudos", coluna: "titulo" },
};

type Supabase = ReturnType<typeof createClient>;

async function hidratarTitulosConvertidos(supabase: Supabase, ideias: Ideia[]) {
  const porTipo = new Map<ConvertivelTipo, string[]>();
  for (const ideia of ideias) {
    if (!ideia.convertida_em_tipo || !ideia.convertida_em_id) continue;
    const lista = porTipo.get(ideia.convertida_em_tipo) ?? [];
    lista.push(ideia.convertida_em_id);
    porTipo.set(ideia.convertida_em_tipo, lista);
  }
  if (porTipo.size === 0) return;

  const titulos = new Map<string, string>();
  await Promise.all(
    Array.from(porTipo.entries()).map(async ([tipo, ids]) => {
      const { tabela, coluna } = TABELA_CONVERSAO[tipo];
      const { data } = await supabase
        .from(tabela)
        .select(`id, ${coluna}`)
        .in("id", ids);
      for (const row of (data ?? []) as Record<string, string>[]) {
        titulos.set(row.id, row[coluna]);
      }
    }),
  );

  for (const ideia of ideias) {
    if (ideia.convertida_em_id) {
      ideia.convertida_em_titulo = titulos.get(ideia.convertida_em_id) ?? null;
    }
  }
}

export default async function IdeiasPage() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("ideias")
    .select(
      "id, titulo, descricao, status, categoria, impacto, esforco, convertida_em_tipo, convertida_em_id, created_at, updated_at, arquivado_em",
    )
    .is("arquivado_em", null)
    .order("created_at", { ascending: false });

  const ideias = (data ?? []) as Ideia[];
  if (!error) {
    await hidratarTitulosConvertidos(supabase, ideias);
  }

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
