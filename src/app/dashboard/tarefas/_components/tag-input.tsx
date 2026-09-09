"use client";

import { useState } from "react";
import { TAG_COLORS, tagTextColor } from "../constants";
import type { TagLite } from "../types";

export type DraftTag = { id?: string; nome: string; cor: string };

export function TagInput({
  value,
  onChange,
  allTags,
}: {
  value: DraftTag[];
  onChange: (tags: DraftTag[]) => void;
  allTags: TagLite[];
}) {
  const [text, setText] = useState("");
  const [cor, setCor] = useState(TAG_COLORS[0]);

  function handleAdd() {
    const nome = text.trim();
    if (!nome) return;

    const jaTem = value.some(
      (t) => t.nome.toLowerCase() === nome.toLowerCase(),
    );
    if (jaTem) {
      setText("");
      return;
    }

    const existente = allTags.find(
      (t) => t.nome.toLowerCase() === nome.toLowerCase(),
    );
    const nova: DraftTag = existente
      ? { id: existente.id, nome: existente.nome, cor: existente.cor ?? cor }
      : { nome, cor };

    onChange([...value, nova]);
    setText("");
    setCor(TAG_COLORS[(TAG_COLORS.indexOf(cor) + 1) % TAG_COLORS.length]);
  }

  function handleRemove(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  const preview = text.trim();

  return (
    <div className="space-y-2">
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((tag, index) => (
            <span
              key={`${tag.nome}-${index}`}
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
              style={{ backgroundColor: tag.cor, color: tagTextColor(tag.cor) }}
            >
              {tag.nome}
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="opacity-70 hover:opacity-100"
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
            onChange={(event) => setText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                handleAdd();
              }
            }}
            placeholder="Nome da tag"
            className="min-w-0 flex-1 rounded-md border border-black/10 bg-white px-2.5 py-1.5 text-sm outline-none transition focus:border-[#24483F] focus:ring-1 focus:ring-[#24483F]"
          />
          <button
            type="button"
            onClick={handleAdd}
            className="shrink-0 rounded-md bg-[#24483F] px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[#1c3a33]"
          >
            Adicionar
          </button>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {TAG_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCor(c)}
              aria-label={`Cor ${c}`}
              aria-pressed={cor === c}
              className={`h-6 w-6 rounded-full transition ${
                cor === c
                  ? "ring-2 ring-gray-900 ring-offset-1"
                  : "ring-1 ring-black/10"
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
          {preview && (
            <span
              className="ml-1 rounded-full px-2 py-0.5 text-xs font-medium"
              style={{ backgroundColor: cor, color: tagTextColor(cor) }}
            >
              {preview}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
