import { createClient } from "@/lib/supabase/server";
import type { Nota, VinculoTipo } from "./actions";
import { NotesList, type VinculoOpcoes } from "./components/NotesList";

const VINCULO_TABELAS: Record<
  VinculoTipo,
  { tabela: string; coluna: "nome" | "titulo" }
> = {
  produto: { tabela: "produtos", coluna: "nome" },
  projeto: { tabela: "projetos", coluna: "nome" },
  evento: { tabela: "eventos", coluna: "nome" },
  ideia: { tabela: "ideias", coluna: "titulo" },
  campanha: { tabela: "campanhas", coluna: "nome" },
};

type Supabase = ReturnType<typeof createClient>;

async function carregarVinculos(supabase: Supabase): Promise<VinculoOpcoes> {
  const tipos = Object.keys(VINCULO_TABELAS) as VinculoTipo[];
  const entries = await Promise.all(
    tipos.map(async (tipo) => {
      const { tabela, coluna } = VINCULO_TABELAS[tipo];
      const { data } = await supabase
        .from(tabela)
        .select(`id, ${coluna}`)
        .is("arquivado_em", null)
        .order("created_at", { ascending: false })
        .limit(200);
      const opcoes = ((data ?? []) as Record<string, string>[]).map((row) => ({
        id: row.id,
        label: row[coluna] || "(sem nome)",
      }));
      return [tipo, opcoes] as const;
    }),
  );
  return Object.fromEntries(entries) as VinculoOpcoes;
}

function hidratarLabels(notas: Nota[], vinculos: VinculoOpcoes) {
  for (const nota of notas) {
    if (nota.entidade_tipo && nota.entidade_id) {
      const opcao = vinculos[nota.entidade_tipo]?.find(
        (o) => o.id === nota.entidade_id,
      );
      nota.entidade_label = opcao?.label ?? null;
    }
  }
}

export default async function NotasPage() {
  const supabase = createClient();
  const [{ data, error }, vinculos] = await Promise.all([
    supabase
      .from("notas")
      .select(
        "id, titulo, conteudo, entidade_tipo, entidade_id, created_at, updated_at, arquivado_em",
      )
      .is("arquivado_em", null)
      .order("created_at", { ascending: false }),
    carregarVinculos(supabase),
  ]);

  const notas = (data ?? []) as Nota[];
  if (!error) hidratarLabels(notas, vinculos);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {error ? (
        <div className="rounded-xl border border-black/5 bg-white p-6 text-sm text-red-600 shadow-sm">
          Não foi possível carregar as notas. Recarregue a página.
        </div>
      ) : (
        <NotesList notas={notas} vinculos={vinculos} />
      )}
    </div>
  );
}
