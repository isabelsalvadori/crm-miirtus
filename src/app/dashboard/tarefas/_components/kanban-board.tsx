"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { moverTarefa } from "../actions";
import type { TarefaListItem } from "../types";
import { TarefaCard } from "./tarefa-card";
import { useMergeHref } from "./use-merge-href";

type Grupo = { value: string; label: string; tarefas: TarefaListItem[] };
type MergeHref = ReturnType<typeof useMergeHref>;

export function KanbanBoard({ grupos }: { grupos: Grupo[] }) {
  const mergeHref = useMergeHref();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const signature = useMemo(
    () =>
      grupos
        .map((g) => `${g.value}:${g.tarefas.map((t) => t.id).join(",")}`)
        .join("|"),
    [grupos],
  );
  const [cols, setCols] = useState<Grupo[]>(() =>
    grupos.map((g) => ({ ...g })),
  );
  const lastSig = useRef(signature);
  useEffect(() => {
    if (lastSig.current !== signature) {
      lastSig.current = signature;
      setCols(grupos.map((g) => ({ ...g })));
    }
  }, [signature, grupos]);

  const [activeId, setActiveId] = useState<string | null>(null);
  const activeCard = useMemo(
    () =>
      cols.flatMap((c) => c.tarefas).find((t) => t.id === activeId) ?? null,
    [cols, activeId],
  );
  const cardStatus = useMemo(() => {
    const map = new Map<string, string>();
    cols.forEach((c) => c.tarefas.forEach((t) => map.set(t.id, c.value)));
    return map;
  }, [cols]);

  function onDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function onDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const cardId = String(active.id);
    const from = cardStatus.get(cardId);
    let to = String(over.id);
    if (!cols.some((c) => c.value === to)) {
      to = cardStatus.get(to) ?? to;
    }
    if (!from || !to || from === to) return;

    setCols((prev) => {
      const card = prev
        .flatMap((c) => c.tarefas)
        .find((t) => t.id === cardId);
      if (!card) return prev;
      return prev.map((c) => {
        if (c.value === from) {
          return { ...c, tarefas: c.tarefas.filter((t) => t.id !== cardId) };
        }
        if (c.value === to) {
          return { ...c, tarefas: [{ ...card, status: to }, ...c.tarefas] };
        }
        return c;
      });
    });

    void moverTarefa(cardId, to);
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:overflow-x-auto md:pb-2">
        {cols.map((col) => (
          <Column key={col.value} col={col} mergeHref={mergeHref} />
        ))}
      </div>
      <DragOverlay>
        {activeCard ? <TarefaCard tarefa={activeCard} overlay /> : null}
      </DragOverlay>
    </DndContext>
  );
}

function Column({ col, mergeHref }: { col: Grupo; mergeHref: MergeHref }) {
  const { setNodeRef, isOver } = useDroppable({ id: col.value });

  return (
    <section className="flex min-w-0 flex-col md:w-72 md:shrink-0">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-gray-700">{col.label}</h3>
          <span className="rounded-full bg-black/5 px-2 py-0.5 text-xs text-gray-500">
            {col.tarefas.length}
          </span>
        </div>
        <Link
          href={mergeHref({ nova: "1", col: col.value, tarefa: null })}
          scroll={false}
          className="text-xs font-medium text-[#24483F] transition-colors hover:underline"
        >
          + Nova
        </Link>
      </div>

      <div
        ref={setNodeRef}
        className={`flex max-h-[calc(100vh-15rem)] flex-col gap-2 overflow-y-auto rounded-xl border p-2 transition-colors ${
          isOver
            ? "border-[#24483F]/40 bg-[#24483F]/5"
            : "border-black/5 bg-black/[0.02]"
        }`}
      >
        <SortableContext
          items={col.tarefas.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {col.tarefas.length === 0 ? (
            <p className="px-2 py-8 text-center text-xs text-gray-400">
              Nenhuma tarefa aqui.
            </p>
          ) : (
            col.tarefas.map((tarefa) => (
              <SortableCard
                key={tarefa.id}
                tarefa={tarefa}
                mergeHref={mergeHref}
              />
            ))
          )}
        </SortableContext>
      </div>
    </section>
  );
}

function SortableCard({
  tarefa,
  mergeHref,
}: {
  tarefa: TarefaListItem;
  mergeHref: MergeHref;
}) {
  const router = useRouter();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: tarefa.id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
      }}
      {...attributes}
      {...listeners}
      onClick={() =>
        router.push(mergeHref({ tarefa: tarefa.id, nova: null }), {
          scroll: false,
        })
      }
      className="cursor-pointer touch-none"
    >
      <TarefaCard tarefa={tarefa} />
    </div>
  );
}
