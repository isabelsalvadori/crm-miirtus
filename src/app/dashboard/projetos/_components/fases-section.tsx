"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  atualizarStatusFase,
  criarFase,
  removerFase,
  renomearFase,
  reordenarFases,
} from "../actions";
import { FASE_STATUS_OPTIONS } from "../constants";
import type { FaseItem } from "../types";

export function FasesSection({
  projetoId,
  fases,
}: {
  projetoId: string;
  fases: FaseItem[];
}) {
  const signature = useMemo(() => fases.map((f) => f.id).join(","), [fases]);
  const [items, setItems] = useState<FaseItem[]>(fases);
  const lastSig = useRef(signature);
  useEffect(() => {
    if (lastSig.current !== signature) {
      lastSig.current = signature;
      setItems(fases);
    }
  }, [signature, fases]);

  const [novoNome, setNovoNome] = useState("");
  const [, startTransition] = useTransition();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setItems((prev) => {
      const oldIndex = prev.findIndex((f) => f.id === active.id);
      const newIndex = prev.findIndex((f) => f.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return prev;

      const next = [...prev];
      const [moved] = next.splice(oldIndex, 1);
      next.splice(newIndex, 0, moved);

      startTransition(() => {
        void reordenarFases(
          projetoId,
          next.map((f) => f.id),
        );
      });

      return next;
    });
  }

  function handleAdd() {
    const nome = novoNome.trim();
    if (!nome) return;
    setNovoNome("");
    startTransition(() => {
      void criarFase(projetoId, nome);
    });
  }

  return (
    <section className="rounded-xl border border-black/5 bg-white p-6 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-900">Fases</h3>

      <div className="mt-4">
        {items.length === 0 ? (
          <p className="text-sm text-gray-400">Nenhuma fase cadastrada.</p>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={onDragEnd}
          >
            <SortableContext
              items={items.map((f) => f.id)}
              strategy={verticalListSortingStrategy}
            >
              <ul className="space-y-2">
                {items.map((fase) => (
                  <FaseRow key={fase.id} projetoId={projetoId} fase={fase} />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        )}
      </div>

      <div className="mt-4 flex gap-2 border-t border-black/5 pt-4">
        <input
          type="text"
          value={novoNome}
          onChange={(event) => setNovoNome(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              handleAdd();
            }
          }}
          placeholder="Nome da nova fase"
          className="flex-1 rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none transition focus:border-[#24483F] focus:ring-1 focus:ring-[#24483F]"
        />
        <button
          type="button"
          onClick={handleAdd}
          className="shrink-0 rounded-lg border border-black/10 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          + Adicionar fase
        </button>
      </div>
    </section>
  );
}

function FaseRow({ projetoId, fase }: { projetoId: string; fase: FaseItem }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: fase.id });
  const [nome, setNome] = useState(fase.nome);
  const [, startTransition] = useTransition();

  useEffect(() => setNome(fase.nome), [fase.nome]);

  function commitNome() {
    const trimmed = nome.trim();
    if (!trimmed || trimmed === fase.nome) {
      setNome(fase.nome);
      return;
    }
    startTransition(() => {
      void renomearFase(projetoId, fase.id, trimmed);
    });
  }

  return (
    <li
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
      }}
      className="flex items-center gap-2 rounded-lg border border-black/5 bg-black/[0.02] px-3 py-2"
    >
      <span
        {...attributes}
        {...listeners}
        className="cursor-grab select-none px-1 text-gray-300 hover:text-gray-500"
        aria-label="Arrastar para reordenar"
      >
        ⠿
      </span>
      <input
        type="text"
        value={nome}
        onChange={(event) => setNome(event.target.value)}
        onBlur={commitNome}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            (event.target as HTMLInputElement).blur();
          }
        }}
        className="min-w-0 flex-1 rounded-md border border-transparent bg-transparent px-1.5 py-1 text-sm text-gray-900 outline-none transition focus:border-[#24483F] focus:bg-white focus:ring-1 focus:ring-[#24483F]"
      />
      <select
        value={fase.status ?? "pendente"}
        onChange={(event) => {
          const status = event.target.value;
          startTransition(() => {
            void atualizarStatusFase(projetoId, fase.id, status);
          });
        }}
        className="shrink-0 rounded-md border border-black/10 bg-white px-2 py-1 text-xs text-gray-700 outline-none"
      >
        {FASE_STATUS_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={() => startTransition(() => void removerFase(projetoId, fase.id))}
        className="shrink-0 px-1 text-xs text-gray-400 hover:text-red-600"
        aria-label="Remover fase"
      >
        ×
      </button>
    </li>
  );
}
