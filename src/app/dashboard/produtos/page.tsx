import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  OK_MESSAGES,
  STATUS_VALUES,
  TIPO_VALUES,
  sanitizeSearch,
} from "./constants";
import { ProdutosFilters } from "./_components/produtos-filters";
import { ProdutosGrid, type ProdutoCard } from "./_components/produtos-grid";
import { Toast } from "./_components/toast";

type ProdutosPageProps = {
  searchParams: {
    q?: string;
    status?: string;
    tipo?: string;
    ok?: string;
  };
};

export default async function ProdutosPage({ searchParams }: ProdutosPageProps) {
  const rawQuery = (searchParams.q ?? "").trim();
  const search = sanitizeSearch(rawQuery);
  const statusParam = searchParams.status ?? "";
  const tipo = TIPO_VALUES.includes(searchParams.tipo ?? "")
    ? (searchParams.tipo as string)
    : "";

  const verArquivados = statusParam === "arquivado";
  const status = STATUS_VALUES.includes(statusParam) ? statusParam : "";
  const hasFilters = Boolean(rawQuery || statusParam || tipo);

  const supabase = createClient();
  let query = supabase
    .from("produtos")
    .select("id, nome, tipo, status, modelo_acesso, preco, moeda")
    .order("created_at", { ascending: false });

  if (verArquivados) {
    query = query.not("arquivado_em", "is", null);
  } else {
    query = query.is("arquivado_em", null);
    if (status) query = query.eq("status", status);
  }
  if (tipo) query = query.eq("tipo", tipo);
  if (search) query = query.ilike("nome", `%${search}%`);

  const { data, error } = await query;
  const produtos = (data ?? []) as ProdutoCard[];

  const okMessage = searchParams.ok ? OK_MESSAGES[searchParams.ok] ?? null : null;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-[#24483F]">Produtos</h2>
          <p className="mt-1 text-sm text-gray-500">
            {produtos.length} {produtos.length === 1 ? "produto" : "produtos"}
          </p>
        </div>
        <Link
          href="/dashboard/produtos/novo"
          className="rounded-lg bg-[#24483F] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#1c3a33]"
        >
          + Novo Produto
        </Link>
      </div>

      {okMessage && <Toast message={okMessage} />}

      <ProdutosFilters />

      {error ? (
        <div className="rounded-xl border border-black/5 bg-white p-6 text-sm text-red-600 shadow-sm">
          Não foi possível carregar os produtos. Recarregue a página.
        </div>
      ) : produtos.length === 0 ? (
        <EmptyState hasFilters={hasFilters} archived={verArquivados} />
      ) : (
        <ProdutosGrid produtos={produtos} />
      )}
    </div>
  );
}

function EmptyState({
  hasFilters,
  archived,
}: {
  hasFilters: boolean;
  archived: boolean;
}) {
  if (archived) {
    return (
      <div className="rounded-xl border border-black/5 bg-white px-6 py-16 text-center shadow-sm">
        <p className="text-sm font-medium text-gray-700">
          Nenhum produto arquivado.
        </p>
      </div>
    );
  }

  if (hasFilters) {
    return (
      <div className="rounded-xl border border-black/5 bg-white px-6 py-16 text-center shadow-sm">
        <p className="text-sm font-medium text-gray-700">
          Nenhum produto encontrado com esses filtros.
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
        Nenhum produto cadastrado ainda.
      </p>
      <p className="mt-1 text-sm text-gray-500">
        Crie o primeiro produto do seu catálogo.
      </p>
      <Link
        href="/dashboard/produtos/novo"
        className="mt-4 inline-block rounded-lg bg-[#24483F] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#1c3a33]"
      >
        + Novo Produto
      </Link>
    </div>
  );
}
