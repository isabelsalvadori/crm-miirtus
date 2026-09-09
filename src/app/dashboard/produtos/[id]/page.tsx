import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  OK_MESSAGES,
  formatDateTime,
  formatPreco,
  modeloAcessoLabel,
  tipoLabel,
} from "../constants";
import { StatusBadge } from "../_components/status-badge";
import { DangerActions } from "../_components/danger-actions";
import { Toast } from "../_components/toast";

type PerfilPageProps = {
  params: { id: string };
  searchParams: { ok?: string };
};

export default async function ProdutoPerfilPage({
  params,
  searchParams,
}: PerfilPageProps) {
  const supabase = createClient();
  const { data: produto } = await supabase
    .from("produtos")
    .select(
      "id, nome, slug, tipo, status, modelo_acesso, preco, moeda, descricao, arquivado_em",
    )
    .eq("id", params.id)
    .maybeSingle();

  if (!produto) {
    notFound();
  }

  const okMessage = searchParams.ok ? OK_MESSAGES[searchParams.ok] ?? null : null;
  const arquivado = Boolean(produto.arquivado_em);
  const preco = formatPreco(produto.preco, produto.moeda ?? "BRL");

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link
        href="/dashboard/produtos"
        className="text-sm text-gray-500 transition-colors hover:text-gray-700"
      >
        ← Produtos
      </Link>

      {okMessage && <Toast message={okMessage} />}

      {/* Header */}
      <div className="rounded-xl border border-black/5 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">
              {produto.nome}
            </h2>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
              <StatusBadge value={produto.status} />
              <span className="text-gray-300">•</span>
              <span className="text-gray-600">{tipoLabel(produto.tipo)}</span>
              <span className="text-gray-300">•</span>
              <span className="text-gray-600">
                {modeloAcessoLabel(produto.modelo_acesso)}
              </span>
            </div>
            {produto.slug && (
              <p className="mt-1 text-xs text-gray-400">/{produto.slug}</p>
            )}
            {arquivado && (
              <p className="mt-2 text-xs font-medium text-amber-700">
                Arquivado em {formatDateTime(produto.arquivado_em)}
              </p>
            )}
          </div>

          <Link
            href={`/dashboard/produtos/${produto.id}/editar`}
            className="rounded-lg border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
          >
            Editar
          </Link>
        </div>

        {preco && (
          <div className="mt-6">
            <dt className="text-xs uppercase tracking-wide text-gray-500">
              Preço
            </dt>
            <dd className="mt-0.5 text-lg font-semibold text-[#24483F]">
              {preco}
            </dd>
          </div>
        )}

        {produto.descricao && (
          <div className="mt-4 border-t border-black/5 pt-4">
            <dt className="text-xs uppercase tracking-wide text-gray-500">
              Descrição
            </dt>
            <dd className="mt-1 whitespace-pre-wrap text-sm text-gray-700">
              {produto.descricao}
            </dd>
          </div>
        )}
      </div>

      {/* Seções futuras */}
      <PlaceholderSection
        title="Versões"
        description="As versões/edições deste produto aparecerão aqui."
      />
      <PlaceholderSection
        title="Projetos relacionados"
        description="Os projetos vinculados a este produto aparecerão aqui."
      />
      <PlaceholderSection
        title="Clientes"
        description="Os clientes que adquiriram este produto aparecerão aqui."
      />
      <PlaceholderSection
        title="Financeiro"
        description="As movimentações financeiras deste produto aparecerão aqui."
      />

      {/* Ações destrutivas — no fim absoluto da página */}
      <DangerActions produtoId={produto.id as string} arquivado={arquivado} />
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
