"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { QuickNoteModal } from "@/app/dashboard/notas/components/QuickNoteModal";
import { criarNotaVinculada } from "./actions";
import { SecaoShell } from "./SecaoShell";
import type { NotaLite } from "./types";

function resumo(nota: NotaLite): string {
  const t = (nota.titulo ?? "").trim();
  if (t) return t;
  const c = (nota.conteudo ?? "").trim().replace(/\s+/g, " ");
  if (!c) return "(sem conteúdo)";
  return c.length > 60 ? `${c.slice(0, 60)}…` : c;
}

function formatData(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function NotasSecao({
  basePath,
  entidadeTipo,
  entidadeId,
  notas,
}: {
  basePath: string;
  entidadeTipo: "pessoa" | "produto" | "projeto";
  entidadeId: string;
  notas: NotaLite[];
}) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);

  return (
    <>
      <SecaoShell
        titulo="Notas"
        count={notas.length}
        vazio="Nenhuma nota registrada ainda."
        acao={
          <button
            type="button"
            onClick={() => setAberto(true)}
            className="rounded-lg border border-[#24483F]/30 bg-white px-2.5 py-1 text-xs font-semibold text-[#24483F] transition-colors hover:bg-[#24483F]/5"
          >
            + Nova nota
          </button>
        }
      >
        <ul className="space-y-2">
          {notas.map((nota) => (
            <li
              key={nota.id}
              className="flex items-baseline gap-3 rounded-lg border border-black/5 bg-white px-3 py-2 text-sm"
            >
              <span className="min-w-0 flex-1 truncate text-[#2D3230]">
                {resumo(nota)}
              </span>
              <span className="shrink-0 text-xs tabular-nums text-gray-400">
                {formatData(nota.created_at)}
              </span>
            </li>
          ))}
        </ul>
      </SecaoShell>

      {aberto && (
        <QuickNoteModal
          action={criarNotaVinculada.bind(null, basePath)}
          entidadeTipo={entidadeTipo}
          entidadeId={entidadeId}
          onClose={() => setAberto(false)}
          onSuccess={() => router.refresh()}
        />
      )}
    </>
  );
}
