"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
import {
  CONTEUDO_STATUS_OPTIONS,
  canalCor,
  conteudoCanalLabel,
  conteudoTipoLabel,
  formatDataHora,
  normalizeConteudoStatus,
  textoContraste,
} from "../../constants";
import type { Catalogos, ConteudoItem } from "../../types";
import { duplicarConteudo, moverConteudo } from "../actions";
import { ConteudoModal } from "./ConteudoModal";

type Coluna = { value: string; label: string; itens: ConteudoItem[] };

/** Filtros client-side acima do quadro — ordem/labels definidas pela UI. */
const FILTRO_CANAL_OPCOES = [
  { value: "instagram", label: "Instagram" },
  { value: "tiktok", label: "TikTok" },
  { value: "facebook", label: "Facebook" },
  { value: "youtube", label: "YouTube" },
  { value: "blog", label: "Blog" },
  { value: "newsletter", label: "Newsletter" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "linkedin", label: "LinkedIn" },
];

const FILTRO_TIPO_OPCOES = [
  { value: "post", label: "Post" },
  { value: "reel", label: "Reel" },
  { value: "story", label: "Story" },
  { value: "carrossel", label: "Carrossel" },
  { value: "video", label: "Vídeo" },
  { value: "artigo", label: "Artigo" },
  { value: "email", label: "Email" },
];

const selectClass =
  "rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-[#2D3230] outline-none transition focus:border-[#24483F] focus:ring-1 focus:ring-[#24483F]";

type ModalState =
  | { modo: "nova"; status?: string }
  | { modo: "edit"; conteudo: ConteudoItem }
  | null;

function agrupar(conteudos: ConteudoItem[]): Coluna[] {
  return CONTEUDO_STATUS_OPTIONS.map((o) => ({
    value: o.value,
    label: o.label,
    itens: conteudos.filter(
      (c) => normalizeConteudoStatus(c.status) === o.value,
    ),
  }));
}

export function ConteudoKanban({
  conteudos,
  catalogos,
}: {
  conteudos: ConteudoItem[];
  catalogos: Catalogos;
}) {
  const [modal, setModal] = useState<ModalState>(null);
  const [canalFiltro, setCanalFiltro] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState("");
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const filtrados = useMemo(
    () =>
      conteudos.filter(
        (c) =>
          (!canalFiltro || c.canal === canalFiltro) &&
          (!tipoFiltro || c.tipo === tipoFiltro),
      ),
    [conteudos, canalFiltro, tipoFiltro],
  );

  const signature = useMemo(
    () =>
      filtrados
        .map((c) => `${c.id}:${normalizeConteudoStatus(c.status)}`)
        .join("|"),
    [filtrados],
  );
  const [cols, setCols] = useState<Coluna[]>(() => agrupar(filtrados));
  const lastSig = useRef(signature);
  useEffect(() => {
    if (lastSig.current !== signature) {
      lastSig.current = signature;
      setCols(agrupar(filtrados));
    }
  }, [signature, filtrados]);

  const [activeId, setActiveId] = useState<string | null>(null);
  const activeCard = useMemo(
    () => cols.flatMap((c) => c.itens).find((c) => c.id === activeId) ?? null,
    [cols, activeId],
  );
  const cardStatus = useMemo(() => {
    const map = new Map<string, string>();
    cols.forEach((c) => c.itens.forEach((i) => map.set(i.id, c.value)));
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
      const card = prev.flatMap((c) => c.itens).find((i) => i.id === cardId);
      if (!card) return prev;
      return prev.map((c) => {
        if (c.value === from) {
          return { ...c, itens: c.itens.filter((i) => i.id !== cardId) };
        }
        if (c.value === to) {
          return { ...c, itens: [{ ...card, status: to }, ...c.itens] };
        }
        return c;
      });
    });

    void moverConteudo(cardId, to);
  }

  const total = conteudos.length;
  const visiveis = filtrados.length;
  const temFiltro = Boolean(canalFiltro || tipoFiltro);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gray-500">
          {temFiltro
            ? `${visiveis} de ${total} ${total === 1 ? "conteúdo" : "conteúdos"}`
            : `${total} ${total === 1 ? "conteúdo" : "conteúdos"} no quadro`}
        </p>
        <button
          type="button"
          onClick={() => setModal({ modo: "nova" })}
          className="rounded-lg bg-[#24483F] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#1c3a33]"
        >
          + Novo Conteúdo
        </button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <select
          value={canalFiltro}
          onChange={(e) => setCanalFiltro(e.target.value)}
          className={selectClass}
          aria-label="Filtrar por canal"
        >
          <option value="">Todos os canais</option>
          {FILTRO_CANAL_OPCOES.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <select
          value={tipoFiltro}
          onChange={(e) => setTipoFiltro(e.target.value)}
          className={selectClass}
          aria-label="Filtrar por tipo"
        >
          <option value="">Todos os tipos</option>
          {FILTRO_TIPO_OPCOES.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        {temFiltro && (
          <button
            type="button"
            onClick={() => {
              setCanalFiltro("");
              setTipoFiltro("");
            }}
            className="text-sm font-medium text-gray-500 transition-colors hover:text-[#24483F]"
          >
            Limpar filtros
          </button>
        )}
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:overflow-x-auto md:pb-2">
          {cols.map((col) => (
            <Column
              key={col.value}
              col={col}
              catalogos={catalogos}
              onNova={() => setModal({ modo: "nova", status: col.value })}
              onAbrir={(conteudo) => setModal({ modo: "edit", conteudo })}
              onDuplicar={(conteudo) => void duplicarConteudo(conteudo.id)}
            />
          ))}
        </div>
        <DragOverlay>
          {activeCard ? (
            <Card conteudo={activeCard} catalogos={catalogos} overlay />
          ) : null}
        </DragOverlay>
      </DndContext>

      {modal && (
        <ConteudoModal
          conteudo={modal.modo === "edit" ? modal.conteudo : null}
          catalogos={catalogos}
          defaultStatus={modal.modo === "nova" ? modal.status : undefined}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}

function Column({
  col,
  catalogos,
  onNova,
  onAbrir,
  onDuplicar,
}: {
  col: Coluna;
  catalogos: Catalogos;
  onNova: () => void;
  onAbrir: (conteudo: ConteudoItem) => void;
  onDuplicar: (conteudo: ConteudoItem) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: col.value });

  return (
    <section className="flex min-w-0 flex-col md:w-72 md:shrink-0">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-gray-700">{col.label}</h3>
          <span className="rounded-full bg-black/5 px-2 py-0.5 text-xs text-gray-500">
            {col.itens.length}
          </span>
        </div>
        <button
          type="button"
          onClick={onNova}
          className="text-xs font-medium text-[#24483F] transition-colors hover:underline"
        >
          + Novo
        </button>
      </div>

      <div
        ref={setNodeRef}
        className={`flex max-h-[calc(100vh-16rem)] flex-col gap-2 overflow-y-auto rounded-xl border p-2 transition-colors ${
          isOver
            ? "border-[#24483F]/40 bg-[#24483F]/5"
            : "border-black/5 bg-black/[0.02]"
        }`}
      >
        <SortableContext
          items={col.itens.map((i) => i.id)}
          strategy={verticalListSortingStrategy}
        >
          {col.itens.length === 0 ? (
            <p className="px-2 py-8 text-center text-xs text-gray-400">
              Nada aqui.
            </p>
          ) : (
            col.itens.map((conteudo) => (
              <SortableCard
                key={conteudo.id}
                conteudo={conteudo}
                catalogos={catalogos}
                onAbrir={() => onAbrir(conteudo)}
                onDuplicar={() => onDuplicar(conteudo)}
              />
            ))
          )}
        </SortableContext>
      </div>
    </section>
  );
}

function SortableCard({
  conteudo,
  catalogos,
  onAbrir,
  onDuplicar,
}: {
  conteudo: ConteudoItem;
  catalogos: Catalogos;
  onAbrir: () => void;
  onDuplicar: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: conteudo.id });

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
      onClick={onAbrir}
      className="cursor-pointer touch-none"
    >
      <Card
        conteudo={conteudo}
        catalogos={catalogos}
        onDuplicar={onDuplicar}
      />
    </div>
  );
}

function Card({
  conteudo,
  catalogos,
  overlay = false,
  onDuplicar,
}: {
  conteudo: ConteudoItem;
  catalogos: Catalogos;
  overlay?: boolean;
  onDuplicar?: () => void;
}) {
  const cor = canalCor(conteudo.canal);
  const produtoNome =
    conteudo.produto_nome ??
    catalogos.produtos.find((p) => p.id === conteudo.produto_id)?.nome ??
    null;

  return (
    <div
      className={`group relative rounded-lg border border-black/5 bg-white px-3 py-2.5 transition-shadow ${
        overlay ? "shadow-lg" : "shadow-sm hover:shadow-md"
      }`}
    >
      {!overlay && onDuplicar && (
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onDuplicar();
          }}
          className="absolute right-1.5 top-1.5 rounded-md border border-black/10 bg-white px-1.5 py-0.5 text-[11px] font-medium text-gray-500 opacity-0 transition-colors hover:border-[#24483F]/40 hover:text-[#24483F] focus-visible:opacity-100 group-hover:opacity-100"
        >
          Duplicar
        </button>
      )}

      <p className="pr-16 text-sm font-medium text-gray-900">{conteudo.titulo}</p>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {conteudo.tipo && (
          <span className="rounded-full bg-black/5 px-2 py-0.5 text-[11px] font-medium text-gray-600">
            {conteudoTipoLabel(conteudo.tipo)}
          </span>
        )}
        {conteudo.canal && (
          <span
            className="rounded-full px-2 py-0.5 text-[11px] font-medium"
            style={{ backgroundColor: cor, color: textoContraste(cor) }}
          >
            {conteudoCanalLabel(conteudo.canal)}
          </span>
        )}
      </div>

      {(produtoNome || conteudo.data_agendada) && (
        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-gray-500">
          {produtoNome && <span>Produto: {produtoNome}</span>}
          {conteudo.data_agendada && (
            <span>📅 {formatDataHora(conteudo.data_agendada)}</span>
          )}
        </div>
      )}
    </div>
  );
}
