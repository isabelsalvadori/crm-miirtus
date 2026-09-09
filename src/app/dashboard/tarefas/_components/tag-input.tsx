"use client";

import { useState } from "react";
import { randomTagColor, tagTextColor } from "../constants";
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

  function addFromText() {
    const nome = text.trim();
    if (!nome) return;
    if (
      value.some((t) => t.nome.toLowerCase() === nome.toLowerCase())
    ) {
      setText("");
      return;
    }
    const existing = allTags.find(
      (t) => t.nome.toLowerCase() === nome.toLowerCase(),
    );
    const next: DraftTag = existing
      ? { id: existing.id, nome: existing.nome, cor: existing.cor ?? randomTagColor() }
      : { nome, cor: randomTagColor() };
    onChange([...value, next]);
    setText("");
  }

  function remove(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  return (
    <div>
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
              onClick={() => remove(index)}
              className="opacity-70 hover:opacity-100"
              aria-label={`Remover ${tag.nome}`}
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <input
        type="text"
        value={text}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            addFromText();
          }
        }}
        onBlur={addFromText}
        placeholder="Digite e pressione Enter"
        list="tarefa-tags-datalist"
        className="mt-2 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none transition focus:border-[#24483F] focus:ring-1 focus:ring-[#24483F]"
      />
      <datalist id="tarefa-tags-datalist">
        {allTags.map((tag) => (
          <option key={tag.id} value={tag.nome} />
        ))}
      </datalist>
    </div>
  );
}
