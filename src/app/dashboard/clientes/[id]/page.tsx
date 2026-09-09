import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  OK_MESSAGES,
  formatDate,
  formatDateTime,
  origemLabel,
} from "../constants";
import { StatusBadge } from "../_components/status-badge";
import { DangerActions } from "../_components/danger-actions";
import { Toast } from "../_components/toast";

type PerfilPageProps = {
  params: { id: string };
  searchParams: { ok?: string };
};

export default async function ClientePerfilPage({
  params,
  searchParams,
}: PerfilPageProps) {
  const supabase = createClient();
  const { data: cliente } = await supabase
    .from("pessoas")
    .select(
      "id, nome, email, telefone, origem, tipo, observacoes, created_at, arquivado_em",
    )
    .eq("id", params.id)
    .maybeSingle();

  if (!cliente) {
    notFound();
  }

  const okMessage = searchParams.ok ? OK_MESSAGES[searchParams.ok] ?? null : null;
  const arquivado = Boolean(cliente.arquivado_em);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link
        href="/dashboard/clientes"
        className="text-sm text-gray-500 transition-colors hover:text-gray-700"
      >
        ← Clientes
      </Link>

      {okMessage && <Toast message={okMessage} />}

      {/* Header */}
      <div className="rounded-xl border border-black/5 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">
              {cliente.nome}
            </h2>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
              <StatusBadge value={cliente.tipo} />
              <span className="text-gray-300">•</span>
              <span className="text-gray-600">
                {origemLabel(cliente.origem)}
              </span>
            </div>
            {arquivado && (
              <p className="mt-2 text-xs font-medium text-amber-700">
                Arquivado em {formatDateTime(cliente.arquivado_em)}
              </p>
            )}
          </div>

          <Link
            href={`/dashboard/clientes/${cliente.id}/editar`}
            className="rounded-lg border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
          >
            Editar
          </Link>
        </div>

        <dl className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-wide text-gray-500">
              E-mail
            </dt>
            <dd className="mt-0.5 text-sm text-gray-800">
              {cliente.email || "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-gray-500">
              Telefone
            </dt>
            <dd className="mt-0.5 text-sm text-gray-800">
              {cliente.telefone || "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-gray-500">
              Origem
            </dt>
            <dd className="mt-0.5 text-sm text-gray-800">
              {origemLabel(cliente.origem)}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-gray-500">
              Criado em
            </dt>
            <dd className="mt-0.5 text-sm text-gray-800">
              {formatDate(cliente.created_at)}
            </dd>
          </div>
        </dl>

        {cliente.observacoes && (
          <div className="mt-4 border-t border-black/5 pt-4">
            <dt className="text-xs uppercase tracking-wide text-gray-500">
              Observações
            </dt>
            <dd className="mt-1 whitespace-pre-wrap text-sm text-gray-700">
              {cliente.observacoes}
            </dd>
          </div>
        )}
      </div>

      {/* Seções futuras */}
      <PlaceholderSection
        title="Linha do tempo"
        description="O histórico de interações deste cliente aparecerá aqui."
      />
      <PlaceholderSection
        title="Produtos"
        description="Os produtos vinculados a este cliente aparecerão aqui."
      />
      <PlaceholderSection
        title="Notas"
        description="As notas registradas para este cliente aparecerão aqui."
      />

      {/* Ações destrutivas — no fim absoluto da página */}
      <DangerActions clienteId={cliente.id as string} arquivado={arquivado} />
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
