import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  OK_MESSAGES,
  formatData,
  formatDateTime,
  isVencido,
  prioridadeLabel,
} from "../constants";
import { progressoDoProjeto, produtosDoProjeto } from "../db";
import { PriorityFlag, StatusBadge } from "../_components/badges";
import { ProgressBar } from "../_components/progress-bar";
import { DangerActions } from "../_components/danger-actions";
import { FasesSection } from "../_components/fases-section";
import { ProdutosRelacionados } from "../_components/produtos-relacionados";
import { Toast } from "../_components/toast";
import type { FaseItem, OptionLite } from "../types";
import { KanbanBoard } from "@/app/dashboard/tarefas/_components/kanban-board";
import { TarefaModal } from "@/app/dashboard/tarefas/_components/tarefa-modal";
import {
  STATUS_OPTIONS as TAREFA_STATUS_OPTIONS,
  STATUS_VALUES as TAREFA_STATUS_VALUES,
  normalizeStatus,
} from "@/app/dashboard/tarefas/constants";
import {
  detectTarefaColumns,
  flattenTags,
  tarefaSelect,
} from "@/app/dashboard/tarefas/db";
import type {
  ContextoLink,
  SubtarefaItem,
  TarefaFull,
  TarefaListItem,
} from "@/app/dashboard/tarefas/types";

type PerfilPageProps = {
  params: { id: string };
  searchParams: {
    ok?: string;
    tarefa?: string;
    nova?: string;
    col?: string;
  };
};

export default async function ProjetoPerfilPage({
  params,
  searchParams,
}: PerfilPageProps) {
  const supabase = createClient();

  const { data: projeto } = await supabase
    .from("projetos")
    .select(
      "id, nome, descricao, status, prioridade, data_inicio, data_fim_prevista, data_fim_real, arquivado_em",
    )
    .eq("id", params.id)
    .maybeSingle();

  if (!projeto) {
    notFound();
  }

  // Tudo aqui só depende do id do projeto (já em mãos) — dispara em paralelo
  // em vez de uma query de cada vez.
  const [progresso, produtosVinculados, fasesRes, produtosRes, tagsRes, cols] =
    await Promise.all([
      progressoDoProjeto(supabase, projeto.id as string),
      produtosDoProjeto(supabase, projeto.id as string),
      supabase
        .from("fases_projeto")
        .select("id, nome, status, ordem")
        .eq("projeto_id", projeto.id)
        .is("arquivado_em", null)
        .order("ordem", { ascending: true }),
      supabase.from("produtos").select("id, nome").is("arquivado_em", null).order("nome"),
      supabase.from("tags").select("id, nome, cor").order("nome"),
      detectTarefaColumns(supabase),
    ]);

  const fases = (fasesRes.data ?? []) as FaseItem[];
  const produtosTodos: OptionLite[] = produtosRes.data ?? [];
  const tags = tagsRes.data ?? [];
  const produtoNome = new Map(produtosTodos.map((p) => [p.id, p.nome]));

  // ----- Tarefas (Kanban filtrado por este projeto) -----
  const abrirNova = searchParams.nova === "1";
  const tarefaId = searchParams.tarefa ?? null;

  // A lista do Kanban e a tarefa aberta no modal só dependem de `cols`,
  // não uma da outra — buscam em paralelo em vez de em sequência.
  const [{ data: tarefaRowsRaw }, tarefaAbertaRes] = await Promise.all([
    supabase
      .from("tarefas")
      .select(tarefaSelect(cols, true))
      .eq("projeto_id", projeto.id)
      .is("parent_id", null)
      .is("arquivado_em", null)
      .order("ordem", { ascending: true })
      .order("created_at", { ascending: false }),
    tarefaId
      ? supabase
          .from("tarefas")
          .select(tarefaSelect(cols, true))
          .eq("id", tarefaId)
          .is("parent_id", null)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const tarefaRows = (tarefaRowsRaw ?? []) as unknown as Record<string, unknown>[];
  const topLevelIds = tarefaRows.map((row) => row.id as string);

  const subResumoMap = new Map<string, { concluidas: number; total: number }>();
  if (topLevelIds.length > 0) {
    const { data: subs } = await supabase
      .from("tarefas")
      .select("parent_id, status")
      .in("parent_id", topLevelIds)
      .is("arquivado_em", null);
    for (const sub of subs ?? []) {
      const pid = sub.parent_id as string;
      const entry = subResumoMap.get(pid) ?? { concluidas: 0, total: 0 };
      entry.total += 1;
      if (sub.status === "concluida") entry.concluidas += 1;
      subResumoMap.set(pid, entry);
    }
  }

  const contextoDe = (row: { produto_id?: string | null }): ContextoLink => {
    if (row.produto_id && produtoNome.has(row.produto_id)) {
      return { tipo: "produto", nome: produtoNome.get(row.produto_id)! };
    }
    return { tipo: "projeto", nome: projeto.nome as string };
  };

  const tarefas: TarefaListItem[] = tarefaRows.map((row) => ({
    id: row.id as string,
    titulo: row.titulo as string,
    status: (row.status as string | null) ?? null,
    prioridade: (row.prioridade as string | null) ?? null,
    data_prazo: (row.data_prazo as string | null) ?? null,
    projeto_id: (row.projeto_id as string | null) ?? null,
    produto_id: (row.produto_id as string | null) ?? null,
    tags: flattenTags(row as never),
    contexto: contextoDe(row as never),
    subtarefasResumo: subResumoMap.get(row.id as string) ?? null,
  }));

  const grupos = TAREFA_STATUS_OPTIONS.map((option) => ({
    value: option.value,
    label: option.label,
    tarefas: tarefas.filter((t) => normalizeStatus(t.status) === option.value),
  }));

  // ----- Modal de tarefa (criar/ver/editar) -----
  let tarefaAberta: TarefaFull | null = null;
  let subtarefas: SubtarefaItem[] = [];

  if (tarefaId) {
    const row = tarefaAbertaRes.data;

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

  const modalOpen = abrirNova || Boolean(tarefaAberta);
  const defaultStatus =
    searchParams.col && TAREFA_STATUS_VALUES.includes(searchParams.col)
      ? searchParams.col
      : undefined;

  const okMessage = searchParams.ok ? OK_MESSAGES[searchParams.ok] ?? null : null;
  const arquivado = Boolean(projeto.arquivado_em);
  const vencido = isVencido(
    projeto.data_fim_prevista as string | null,
    projeto.status as string | null,
  );

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link
        href="/dashboard/projetos"
        className="text-sm text-gray-500 transition-colors hover:text-gray-700"
      >
        ← Projetos
      </Link>

      {okMessage && <Toast message={okMessage} />}

      {/* Header */}
      <div className="rounded-xl border border-black/5 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">{projeto.nome}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
              <StatusBadge value={projeto.status as string | null} />
              <span className="inline-flex items-center gap-1 text-gray-600">
                <PriorityFlag value={projeto.prioridade as string | null} />
                {prioridadeLabel(projeto.prioridade as string | null)}
              </span>
            </div>
            {arquivado && (
              <p className="mt-2 text-xs font-medium text-amber-700">
                Arquivado em {formatDateTime(projeto.arquivado_em as string)}
              </p>
            )}
          </div>

          <Link
            href={`/dashboard/projetos/${projeto.id}/editar`}
            className="rounded-lg border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
          >
            Editar
          </Link>
        </div>

        <div className="mt-5 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Progresso</span>
            <span>
              {progresso.concluidas}/{progresso.total} tarefas · {progresso.percentual}%
            </span>
          </div>
          <ProgressBar percentual={progresso.percentual} />
        </div>

        <dl className="mt-5 grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-wide text-gray-500">
              Data início
            </dt>
            <dd className="mt-0.5 text-sm text-gray-800">
              {projeto.data_inicio ? formatData(projeto.data_inicio as string) : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-gray-500">Prazo</dt>
            {projeto.data_fim_prevista ? (
              <dd
                className={`mt-0.5 text-sm ${
                  vencido ? "font-semibold text-red-600" : "text-gray-800"
                }`}
              >
                {formatData(projeto.data_fim_prevista as string)}
                {vencido && " (vencido)"}
              </dd>
            ) : (
              <dd className="mt-0.5 text-sm italic text-gray-300">Prazo indefinido</dd>
            )}
          </div>
        </dl>

        {projeto.descricao && (
          <div className="mt-4 border-t border-black/5 pt-4">
            <dt className="text-xs uppercase tracking-wide text-gray-500">
              Descrição
            </dt>
            <dd className="mt-1 whitespace-pre-wrap text-sm text-gray-700">
              {projeto.descricao}
            </dd>
          </div>
        )}
      </div>

      {/* Fases */}
      <FasesSection projetoId={projeto.id as string} fases={fases} />

      {/* Tarefas */}
      <section className="rounded-xl border border-black/5 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-900">Tarefas</h3>
        <div className="mt-4">
          <KanbanBoard grupos={grupos} />
        </div>
      </section>

      {modalOpen && (
        <TarefaModal
          key={tarefaId ?? "nova"}
          mode={tarefaAberta ? "view" : "create"}
          tarefa={tarefaAberta}
          subtarefas={subtarefas}
          produtos={produtosTodos}
          projetos={[]}
          tags={tags}
          defaultStatus={defaultStatus}
          lockedProjeto={{ id: projeto.id as string, nome: projeto.nome as string }}
          redirectTo={`/dashboard/projetos/${projeto.id}`}
        />
      )}

      {/* Produtos relacionados */}
      <ProdutosRelacionados
        projetoId={projeto.id as string}
        vinculados={produtosVinculados}
        disponiveis={produtosTodos}
      />

      {/* Seções futuras */}
      <PlaceholderSection
        title="Financeiro"
        description="As movimentações financeiras deste projeto aparecerão aqui."
      />
      <PlaceholderSection
        title="Documentos"
        description="Os documentos deste projeto aparecerão aqui."
      />
      <PlaceholderSection
        title="Notas"
        description="As notas deste projeto aparecerão aqui."
      />

      {/* Ações destrutivas — no fim absoluto da página */}
      <DangerActions projetoId={projeto.id as string} arquivado={arquivado} />
    </div>
  );
}

function PlaceholderSection({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <section className="rounded-xl border border-black/5 bg-white p-6 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      <div className="mt-3 rounded-lg border border-dashed border-black/10 bg-[#F5F1E8]/50 px-4 py-8 text-center">
        <p className="text-sm text-gray-500">{description}</p>
      </div>
    </section>
  );
}
