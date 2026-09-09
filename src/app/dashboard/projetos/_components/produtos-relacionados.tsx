"use client";

import { useMemo, useState, useTransition } from "react";
import { desvincularProduto, vincularProduto } from "../actions";
import type { OptionLite } from "../types";

export function ProdutosRelacionados({
  projetoId,
  vinculados,
  disponiveis,
}: {
  projetoId: string;
  vinculados: OptionLite[];
  disponiveis: OptionLite[];
}) {
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();

  const vinculadosIds = useMemo(
    () => new Set(vinculados.map((p) => p.id)),
    [vinculados],
  );
  const restantes = disponiveis.filter((p) => !vinculadosIds.has(p.id));

  return (
    <section className="rounded-xl border border-black/5 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Produtos relacionados</h3>
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="rounded-lg border border-black/10 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            + Adicionar produto
          </button>
          {open && (
            <>
              <div
                aria-hidden
                onClick={() => setOpen(false)}
                className="fixed inset-0 z-10"
              />
              <div className="absolute right-0 z-20 mt-2 max-h-56 w-56 overflow-y-auto rounded-lg border border-black/10 bg-white p-1.5 shadow-lg">
                {restantes.length === 0 ? (
                  <p className="px-2 py-3 text-center text-xs text-gray-400">
                    Nenhum produto disponível.
                  </p>
                ) : (
                  restantes.map((produto) => (
                    <button
                      key={produto.id}
                      type="button"
                      onClick={() => {
                        setOpen(false);
                        startTransition(() => {
                          void vincularProduto(projetoId, produto.id);
                        });
                      }}
                      className="block w-full rounded-md px-2 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-50"
                    >
                      {produto.nome}
                    </button>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {vinculados.length === 0 ? (
          <p className="text-sm text-gray-400">Nenhum produto vinculado.</p>
        ) : (
          vinculados.map((produto) => (
            <span
              key={produto.id}
              className="inline-flex items-center gap-1.5 rounded-full bg-black/5 px-3 py-1 text-xs font-medium text-gray-700"
            >
              {produto.nome}
              <button
                type="button"
                onClick={() =>
                  startTransition(() => void desvincularProduto(projetoId, produto.id))
                }
                className="opacity-60 hover:opacity-100"
                aria-label={`Remover ${produto.nome}`}
              >
                ×
              </button>
            </span>
          ))
        )}
      </div>
    </section>
  );
}
