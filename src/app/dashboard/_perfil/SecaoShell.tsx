import type { ReactNode } from "react";

/**
 * Casca visual comum das seções de perfil: título + contador entre
 * parênteses, ação opcional à direita e estado vazio amigável.
 * Sem hooks — pode ser usada tanto em Server quanto em Client Components.
 */
export function SecaoShell({
  titulo,
  count,
  acao,
  vazio,
  children,
}: {
  titulo: string;
  count: number;
  acao?: ReactNode;
  vazio: string;
  children?: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-black/5 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-gray-900">
          {titulo}{" "}
          <span className="font-normal text-gray-400">({count})</span>
        </h3>
        {acao}
      </div>

      {count === 0 ? (
        <div className="mt-3 rounded-lg border border-dashed border-black/10 bg-[#F5F1E8]/50 px-4 py-8 text-center">
          <p className="text-sm text-gray-500">{vazio}</p>
        </div>
      ) : (
        <div className="mt-4">{children}</div>
      )}
    </section>
  );
}
