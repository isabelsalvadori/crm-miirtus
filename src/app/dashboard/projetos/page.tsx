import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  OK_MESSAGES,
  PRIORIDADE_VALUES,
  STATUS_VALUES,
  sanitizeSearch,
} from "./constants";
import { progressoEmLote, produtosEmLote } from "./db";
import type { ProjetoListItem } from "./types";
import { ProjetosFilters } from "./_components/projetos-filters";
import { ProjetosGrid } from "./_components/projetos-grid";
import { Toast } from "./_components/toast";

type ProjetosPageProps = {
  searchParams: {
    q?: string;
    status?: string;
    prioridade?: string;
    ok?: string;
  };
};

export default async function ProjetosPage({ searchParams }: ProjetosPageProps) {
  const rawQuery = (searchParams.q ?? "").trim();
  const search = sanitizeSearch(rawQuery);
  const status = STATUS_VALUES.includes(searchParams.status ?? "")
    ? (searchParams.status as string)
    : "";
  const prioridade = PRIORIDADE_VALUES.includes(searchParams.prioridade ?? "")
    ? (searchParams.prioridade as string)
    : "";
  const hasFilters = Boolean(rawQuery || status || prioridade);

  const supabase = createClient();
  let query = supabase
    .from("projetos")
    .select("id, nome, status, prioridade, data_inicio, data_fim_prevista")
    .is("arquivado_em", null)
    .order("created_at", { ascending: false });

  if (search) query = query.ilike("nome", `%${search}%`);
  if (status) query = query.eq("status", status);
  if (prioridade) query = query.eq("prioridade", prioridade);

  const { data, error } = await query;
  const rows = data ?? [];
  const ids = rows.map((row) => row.id as string);

  const [progressoMap, produtosMap] = await Promise.all([
    progressoEmLote(supabase, ids),
    produtosEmLote(supabase, ids),
  ]);

  const projetos: ProjetoListItem[] = rows.map((row) => ({
    id: row.id as string,
    nome: row.nome as string,
    status: (row.status as string | null) ?? null,
    prioridade: (row.prioridade as string | null) ?? null,
    data_inicio: (row.data_inicio as string | null) ?? null,
    data_fim_prevista: (row.data_fim_prevista as string | null) ?? null,
    progresso: progressoMap.get(row.id as string) ?? {
      concluidas: 0,
      total: 0,
      percentual: 0,
    },
    produtos: produtosMap.get(row.id as string) ?? [],
  }));

  const okMessage = searchParams.ok ? OK_MESSAGES[searchParams.ok] ?? null : null;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-[#24483F]">Projetos</h2>
          <p className="mt-1 text-sm text-gray-500">
            {projetos.length} {projetos.length === 1 ? "projeto" : "projetos"}
          </p>
        </div>
        <Link
          href="/dashboard/projetos/novo"
          className="rounded-lg bg-[#24483F] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#1c3a33]"
        >
          + Novo Projeto
        </Link>
      </div>

      {okMessage && <Toast message={okMessage} />}

      <ProjetosFilters />

      {error ? (
        <div className="rounded-xl border border-black/5 bg-white p-6 text-sm text-red-600 shadow-sm">
          Não foi possível carregar os projetos. Recarregue a página.
        </div>
      ) : projetos.length === 0 ? (
        <EmptyState hasFilters={hasFilters} />
      ) : (
        <ProjetosGrid projetos={projetos} />
      )}
    </div>
  );
}

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  if (hasFilters) {
    return (
      <div className="rounded-xl border border-black/5 bg-white px-6 py-16 text-center shadow-sm">
        <p className="text-sm font-medium text-gray-700">
          Nenhum projeto encontrado com esses filtros.
        </p>
        <p className="mt-1 text-sm text-gray-500">
          Ajuste a busca ou limpe os filtros para ver todos.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-black/5 bg-white px-6 py-16 text-center shadow-sm">
      <p className="text-sm font-medium text-gray-700">
        Nenhum projeto cadastrado ainda.
      </p>
      <p className="mt-1 text-sm text-gray-500">
        Crie o primeiro projeto para organizar o trabalho.
      </p>
      <Link
        href="/dashboard/projetos/novo"
        className="mt-4 inline-block rounded-lg bg-[#24483F] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#1c3a33]"
      >
        + Novo Projeto
      </Link>
    </div>
  );
}
