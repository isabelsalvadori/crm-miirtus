"use client";

import { useState } from "react";

export type DraftSubtarefa = { id?: string; titulo: string; concluida: boolean };

export function SubtarefasEditor({
  value,
  onChange,
}: {
  value: DraftSubtarefa[];
  onChange: (subs: DraftSubtarefa[]) => void;
}) {
  const [text, setText] = useState("");

  function add() {
    const titulo = text.trim();
    if (!titulo) return;
    onChange([...value, { titulo, concluida: false }]);
    setText("");
  }

  function update(index: number, patch: Partial<DraftSubtarefa>) {
    onChange(value.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  }

  function remove(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-2">
      {value.length > 0 && (
        <ul className="space-y-1.5">
          {value.map((sub, index) => (
            <li key={sub.id ?? `new-${index}`} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={sub.concluida}
                onChange={(event) =>
                  update(index, { concluida: event.target.checked })
                }
                className="h-4 w-4 rounded border-gray-300 text-[#24483F] focus:ring-[#24483F]"
              />
              <input
                type="text"
                value={sub.titulo}
                onChange={(event) => update(index, { titulo: event.target.value })}
                className={`flex-1 rounded-md border border-black/10 bg-white px-2 py-1 text-sm outline-none focus:border-[#24483F] focus:ring-1 focus:ring-[#24483F] ${
                  sub.concluida ? "text-gray-400 line-through" : "text-gray-900"
                }`}
              />
              <button
                type="button"
                onClick={() => remove(index)}
                className="text-xs text-gray-400 hover:text-gray-600"
                aria-label="Remover subtarefa"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              add();
            }
          }}
          placeholder="Adicionar subtarefa"
          className="flex-1 rounded-md border border-black/10 bg-white px-2 py-1 text-sm outline-none focus:border-[#24483F] focus:ring-1 focus:ring-[#24483F]"
        />
        <button
          type="button"
          onClick={add}
          className="rounded-md border border-black/10 px-3 py-1 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
        >
          Adicionar
        </button>
      </div>
    </div>
  );
}
