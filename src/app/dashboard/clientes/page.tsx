import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  OK_MESSAGES,
  ORIGEM_VALUES,
  PAGE_SIZE,
  STATUS_VALUES,
  sanitizeSearch,
} from "./constants";
import { ClientesFilters } from "./_components/clientes-filters";
import { ClientesTable, type ClienteRow } from "./_components/clientes-table";
import { Pagination } from "./_components/pagination";
import { Toast } from "./_components/toast";

type ClientesPageProps = {
  searchParams: {
    q?: string;
    status?: string;
    origem?: string;
    page?: string;
    ok?: string;
  };
};

export default async function ClientesPage({ searchParams }: ClientesPageProps) {
  const rawQuery = (searchParams.q ?? "").trim();
  const search = sanitizeSearch(rawQuery);
  const status = STATUS_VALUES.includes(searchParams.status ?? "")
    ? (searchParams.status as string)
    : "";
  const origem = ORIGEM_VALUES.includes(searchParams.origem ?? "")
    ? (searchParams.origem as string)
    : "";
  const page = Math.max(
    1,
    Number.parseInt(searchParams.page ?? "1", 10) || 1,
  );

  const hasFilters = Boolean(rawQuery || status || origem);
  const rangeFrom = (page - 1) * PAGE_SIZE;
  const rangeTo = rangeFrom + PAGE_SIZE - 1;

  const supabase = createClient();
  let query = supabase
    .from("pessoas")
    .select("id, nome, email, telefone, origem, tipo, created_at", {
      count: "exact",
    })
    .is("arquivado_em", null)
    .order("created_at", { ascending: false })
    .range(rangeFrom, rangeTo);

  if (search) {
    query = query.or(`nome.ilike.%${search}%,email.ilike.%${search}%`);
  }
  if (status) {
    query = query.eq("tipo", status);
  }
  if (origem) {
    query = query.eq("origem", origem);
  }

  const { data, count, error } = await query;
  const clientes = (data ?? []) as ClienteRow[];
  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const okMessage = searchParams.ok ? OK_MESSAGES[searchParams.ok] ?? null : null;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-[#24483F]">Clientes</h2>
          <p className="mt-1 text-sm text-gray-500">
            {total} {total === 1 ? "registro" : "registros"}
          </p>
        </div>
        <Link
          href="/dashboard/clientes/novo"
          className="rounded-lg bg-[#24483F] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#1c3a33]"
        >
          + Novo Cliente
        </Link>
      </div>

      {okMessage && <Toast message={okMessage} />}

      <ClientesFilters />

      <div className="rounded-xl border border-black/5 bg-white shadow-sm">
        {error ? (
          <p className="p-6 text-sm text-red-600">
            Não foi possível carregar os clientes. Recarregue a página.
          </p>
        ) : clientes.length === 0 ? (
          <EmptyState hasFilters={hasFilters} />
        ) : (
          <ClientesTable clientes={clientes} />
        )}
      </div>

      {totalPages > 1 && <Pagination page={page} totalPages={totalPages} />}
    </div>
  );
}

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  if (hasFilters) {
    return (
      <div className="px-6 py-16 text-center">
        <p className="text-sm font-medium text-gray-700">
          Nenhum cliente encontrado com esses filtros.
        </p>
        <p className="mt-1 text-sm text-gray-500">
          Ajuste a busca ou limpe os filtros para ver todos.
        </p>
      </div>
    );
  }

  return (
    <div className="px-6 py-16 text-center">
      <p className="text-sm font-medium text-gray-700">
        Nenhum cliente cadastrado ainda.
      </p>
      <p className="mt-1 text-sm text-gray-500">
        Comece adicionando o primeiro cliente da sua base.
      </p>
      <Link
        href="/dashboard/clientes/novo"
        className="mt-4 inline-block rounded-lg bg-[#24483F] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#1c3a33]"
      >
        + Novo Cliente
      </Link>
    </div>
  );
}
