"use client";

import { useState } from "react";
import { TAG_COLORS, tagTextColor } from "../constants";
import type { DraftTag, TagLite } from "../types";

/**
 * Campo de tags autocontido: mantém o estado internamente e serializa
 * em um <input type="hidden" name="tags_json"> para a Server Action.
 */
export function TagField({
  initial,
  sugestoes,
}: {
  initial: TagLite[];
  sugestoes: TagLite[];
}) {
  const [tags, setTags] = useState<DraftTag[]>(() =>
    initial.map((t) => ({
      id: t.id,
      nome: t.nome,
      cor: t.cor ?? TAG_COLORS[0],
    })),
  );
  const [text, setText] = useState("");
  const [cor, setCor] = useState(TAG_COLORS[0]);

  function adicionar() {
    const nome = text.trim();
    if (!nome) return;
    if (tags.some((t) => t.nome.toLowerCase() === nome.toLowerCase())) {
      setText("");
      return;
    }
    const existente = sugestoes.find(
      (t) => t.nome.toLowerCase() === nome.toLowerCase(),
    );
    const nova: DraftTag = existente
      ? { id: existente.id, nome: existente.nome, cor: existente.cor ?? cor }
      : { nome, cor };
    setTags([...tags, nova]);
    setText("");
    setCor(TAG_COLORS[(TAG_COLORS.indexOf(cor) + 1) % TAG_COLORS.length]);
  }

  function remover(index: number) {
    setTags(tags.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-2">
      <input type="hidden" name="tags_json" value={JSON.stringify(tags)} />

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag, index) => (
            <span
              key={`${tag.nome}-${index}`}
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
              style={{ backgroundColor: tag.cor, color: tagTextColor(tag.cor) }}
            >
              {tag.nome}
              <button
                type="button"
                onClick={() => remover(index)}
                className="opacity-70 transition-opacity hover:opacity-100"
                aria-label={`Remover ${tag.nome}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="rounded-lg border border-black/10 p-2.5">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                adicionar();
              }
            }}
            placeholder="Nome da tag"
            list="biblioteca-tags-sugestoes"
            className="min-w-0 flex-1 rounded-md border border-black/10 bg-white px-2.5 py-1.5 text-sm text-[#2D3230] outline-none transition focus:border-[#24483F] focus:ring-1 focus:ring-[#24483F]"
          />
          <button
            type="button"
            onClick={adicionar}
            className="shrink-0 rounded-md bg-[#24483F] px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[#1c3a33]"
          >
            Adicionar
          </button>
        </div>

        <datalist id="biblioteca-tags-sugestoes">
          {sugestoes.map((t) => (
            <option key={t.id} value={t.nome} />
          ))}
        </datalist>

        <div className="mt-2.5 flex flex-wrap gap-2">
          {TAG_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCor(c)}
              aria-label={`Cor ${c}`}
              aria-pressed={cor === c}
              className={`h-6 w-6 rounded-full transition ${
                cor === c
                  ? "border-2 border-white shadow-[0_0_0_2px_#111827]"
                  : "border border-black/10"
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
