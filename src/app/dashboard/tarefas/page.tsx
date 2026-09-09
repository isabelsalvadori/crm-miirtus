import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  OK_MESSAGES,
  PRIORIDADE_VALUES,
  STATUS_OPTIONS,
  STATUS_VALUES,
  normalizeStatus,
  sanitizeSearch,
} from "./constants";
import { detectTarefaColumns, flattenTags, tarefaSelect } from "./db";
import type {
  ContextoLink,
  OptionLite,
  SubtarefaItem,
  TarefaFull,
  TarefaListItem,
} from "./types";
import { KanbanBoard } from "./_components/kanban-board";
import { TarefasFilters } from "./_components/tarefas-filters";
import { TarefaModal } from "./_components/tarefa-modal";
import { Toast } from "./_components/toast";

type SearchParams = {
  q?: string;
  status?: string;
  prioridade?: string;
  contexto?: string;
  tarefa?: string;
  nova?: string;
  col?: string;
  ok?: string;
};

export default async function TarefasPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const supabase = createClient();
  const cols = await detectTarefaColumns(supabase);
  const hasProdutoCol = cols.has("produto_id");

  const rawQuery = (searchParams.q ?? "").trim();
  const search = sanitizeSearch(rawQuery);
  const status = STATUS_VALUES.includes(searchParams.status ?? "")
    ? (searchParams.status as string)
    : "";
  const prioridade = PRIORIDADE_VALUES.includes(searchParams.prioridade ?? "")
    ? (searchParams.prioridade as string)
    : "";
  const contexto = searchParams.contexto ?? "";

  const [produtosRes, projetosRes, tagsRes] = await Promise.all([
    supabase
      .from("produtos")
      .select("id, nome")
      .is("arquivado_em", null)
      .order("nome"),
    supabase
      .from("projetos")
      .select("id, nome")
      .is("arquivado_em", null)
      .order("nome"),
    supabase.from("tags").select("id, nome, cor").order("nome"),
  ]);

  const produtos: OptionLite[] = produtosRes.data ?? [];
  const projetos: OptionLite[] = projetosRes.data ?? [];
  const tags = tagsRes.data ?? [];
  const produtoNome = new Map(produtos.map((p) => [p.id, p.nome]));
  const projetoNome = new Map(projetos.map((p) => [p.id, p.nome]));

  let query = supabase
    .from("tarefas")
    .select(tarefaSelect(cols, true))
    .is("arquivado_em", null)
    .is("parent_id", null)
    .order("ordem", { ascending: true })
    .order("created_at", { ascending: false });

  if (search) query = query.ilike("titulo", `%${search}%`);
  if (status) query = query.eq("status", status);
  if (prioridade) query = query.eq("prioridade", prioridade);
  if (contexto === "sem_vinculo") {
    query = query.is("projeto_id", null);
    if (hasProdutoCol) query = query.is("produto_id", null);
  } else if (contexto.startsWith("produto:") && hasProdutoCol) {
    query = query.eq("produto_id", contexto.slice("produto:".length));
  } else if (contexto.startsWith("projeto:")) {
    query = query.eq("projeto_id", contexto.slice("projeto:".length));
  }

  const { data: rows, error } = await query;

  const contextoDe = (row: {
    produto_id?: string | null;
    projeto_id: string | null;
  }): ContextoLink => {
    if (row.produto_id && produtoNome.has(row.produto_id)) {
      return { tipo: "produto", nome: produtoNome.get(row.produto_id)! };
    }
    if (row.projeto_id && projetoNome.has(row.projeto_id)) {
      return { tipo: "projeto", nome: projetoNome.get(row.projeto_id)! };
    }
    return null;
  };

  const tarefaRows = (rows ?? []) as unknown as Record<string, unknown>[];
  const tarefas: TarefaListItem[] = tarefaRows.map(
    (row) => ({
      id: row.id as string,
      titulo: row.titulo as string,
      status: (row.status as string | null) ?? null,
      prioridade: (row.prioridade as string | null) ?? null,
      data_prazo: (row.data_prazo as string | null) ?? null,
      projeto_id: (row.projeto_id as string | null) ?? null,
      produto_id: (row.produto_id as string | null) ?? null,
      tags: flattenTags(row as never),
      contexto: contextoDe(row as never),
    }),
  );

  const grupos = STATUS_OPTIONS.map((option) => ({
    value: option.value,
    label: option.label,
    tarefas: tarefas.filter(
      (t) => normalizeStatus(t.status) === option.value,
    ),
  }));

  // ----- Modal -----
  const abrirNova = searchParams.nova === "1";
  const tarefaId = searchParams.tarefa ?? null;
  let tarefaAberta: TarefaFull | null = null;
  let subtarefas: SubtarefaItem[] = [];

  if (tarefaId) {
    const { data: row } = await supabase
      .from("tarefas")
      .select(tarefaSelect(cols, true))
      .eq("id", tarefaId)
      .is("parent_id", null)
      .maybeSingle();

    if (row) {
      const r = row as unknown as Record<string, unknown>;
      tarefaAberta = {
        id: r.id as string,
        titulo: r.titulo as string,
        descricao: (r.descricao as string | null) ?? null,
        observacoes: (r.observacoes as string | null) ?? null,
        status: (r.status as string | null) ?? null,
        prioridade: (r.prioridade as string | null) ?? null,
        data_prazo: (r.data_prazo as string | null) ?? null,
        data_conclusao: (r.data_conclusao as string | null) ?? null,
        projeto_id: (r.projeto_id as string | null) ?? null,
        produto_id: (r.produto_id as string | null) ?? null,
        agenda_data: (r.agenda_data as string | null) ?? null,
        agenda_hora_inicio: (r.agenda_hora_inicio as string | null) ?? null,
        agenda_hora_fim: (r.agenda_hora_fim as string | null) ?? null,
        tags: flattenTags(row as never),
        contexto: contextoDe(r as never),
      };

      const { data: subs } = await supabase
        .from("tarefas")
        .select("id, titulo, status")
        .eq("parent_id", tarefaId)
        .order("ordem", { ascending: true })
        .order("created_at", { ascending: true });
      subtarefas = (subs as SubtarefaItem[]) ?? [];
    }
  }

  const okMessage = searchParams.ok ? OK_MESSAGES[searchParams.ok] ?? null : null;
  const modalOpen = abrirNova || Boolean(tarefaAberta);
  const defaultStatus =
    searchParams.col && STATUS_VALUES.includes(searchParams.col)
      ? searchParams.col
      : undefined;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-[#24483F]">Tarefas</h2>
          <p className="mt-1 text-sm text-gray-500">
            {tarefas.length} {tarefas.length === 1 ? "tarefa" : "tarefas"}
          </p>
        </div>
        <Link
          href="?nova=1"
          scroll={false}
          className="rounded-lg bg-[#24483F] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#1c3a33]"
        >
          + Nova Tarefa
        </Link>
      </div>

      {okMessage && <Toast message={okMessage} />}

      <TarefasFilters produtos={produtos} projetos={projetos} />

      {error ? (
        <div className="rounded-xl border border-black/5 bg-white p-6 text-sm text-red-600 shadow-sm">
          Não foi possível carregar as tarefas. Recarregue a página.
        </div>
      ) : (
        <KanbanBoard grupos={grupos} />
      )}

      {modalOpen && (
        <TarefaModal
          key={tarefaId ?? "nova"}
          mode={tarefaAberta ? "view" : "create"}
          tarefa={tarefaAberta}
          subtarefas={subtarefas}
          produtos={produtos}
          projetos={projetos}
          tags={tags}
          defaultStatus={defaultStatus}
        />
      )}
    </div>
  );
}
