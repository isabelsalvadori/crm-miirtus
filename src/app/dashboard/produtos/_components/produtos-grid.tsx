"use client";

import { useRouter } from "next/navigation";
import {
  formatPreco,
  modeloAcessoLabel,
  tipoLabel,
} from "../constants";
import { StatusBadge } from "./status-badge";

export type ProdutoCard = {
  id: string;
  nome: string;
  tipo: string | null;
  status: string | null;
  modelo_acesso: string | null;
  preco: number | string | null;
  moeda: string | null;
};

export function ProdutosGrid({ produtos }: { produtos: ProdutoCard[] }) {
  const router = useRouter();

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {produtos.map((produto) => {
        const preco = formatPreco(produto.preco, produto.moeda ?? "BRL");

        return (
          <button
            key={produto.id}
            type="button"
            onClick={() => router.push(`/dashboard/produtos/${produto.id}`)}
            className="flex flex-col rounded-xl border border-black/5 bg-white p-5 text-left shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-semibold text-gray-900">{produto.nome}</h3>
              <StatusBadge value={produto.status} />
            </div>

            <p className="mt-1 text-sm text-gray-500">
              {tipoLabel(produto.tipo)}
            </p>

            <div className="mt-4 flex items-end justify-between gap-3">
              <span className="text-xs uppercase tracking-wide text-gray-400">
                {modeloAcessoLabel(produto.modelo_acesso)}
              </span>
              {preco && (
                <span className="text-sm font-semibold text-[#24483F]">
                  {preco}
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
