"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { QuickNoteModal } from "@/app/dashboard/notas/components/QuickNoteModal";
import { CapturaToast } from "./captura/CapturaToast";
import { QuickConteudoModal } from "./captura/QuickConteudoModal";
import { QuickEventoModal } from "./captura/QuickEventoModal";
import { QuickIdeiaModal } from "./captura/QuickIdeiaModal";
import { QuickLinkModal } from "./captura/QuickLinkModal";
import { QuickMovimentacaoModal } from "./captura/QuickMovimentacaoModal";
import { TarefaModalLoader } from "./captura/TarefaModalLoader";

type OpcaoKey =
  | "tarefa"
  | "ideia"
  | "nota"
  | "evento"
  | "receita"
  | "despesa"
  | "conteudo"
  | "link";

const OPCOES: { key: OpcaoKey; emoji: string; label: string }[] = [
  { key: "tarefa", emoji: "✅", label: "Tarefa" },
  { key: "ideia", emoji: "💡", label: "Ideia" },
  { key: "nota", emoji: "📝", label: "Nota" },
  { key: "evento", emoji: "📅", label: "Evento" },
  { key: "receita", emoji: "💰", label: "Receita" },
  { key: "despesa", emoji: "💸", label: "Despesa" },
  { key: "conteudo", emoji: "📢", label: "Conteúdo" },
  { key: "link", emoji: "🔗", label: "Link" },
];

const TOAST_INFO: Record<OpcaoKey, { label: string; href: string }> = {
  tarefa: { label: "Tarefa criada", href: "/dashboard/tarefas" },
  ideia: { label: "Ideia criada", href: "/dashboard/ideias" },
  nota: { label: "Nota criada", href: "/dashboard/notas" },
  evento: { label: "Evento criado", href: "/dashboard/eventos" },
  receita: { label: "Receita criada", href: "/dashboard/financeiro/receitas" },
  despesa: { label: "Despesa criada", href: "/dashboard/financeiro/despesas" },
  conteudo: { label: "Conteúdo criado", href: "/dashboard/marketing/conteudo" },
  link: { label: "Link salvo no Acervo", href: "/dashboard/biblioteca/acervo" },
};

export function FAB() {
  const [menuAberto, setMenuAberto] = useState(false);
  const [modal, setModal] = useState<OpcaoKey | null>(null);
  const [toast, setToast] = useState<OpcaoKey | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Clicar fora / Esc fecha o menu.
  useEffect(() => {
    if (!menuAberto) return;
    function onDown(event: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) {
        setMenuAberto(false);
      }
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuAberto(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuAberto]);

  const abrir = useCallback((key: OpcaoKey) => {
    setModal(key);
    setMenuAberto(false);
  }, []);

  const fecharModal = useCallback(() => setModal(null), []);
  const concluir = useCallback((key: OpcaoKey) => {
    setModal(null);
    setToast(key);
  }, []);

  return (
    <>
      <div
        ref={wrapRef}
        className="fixed bottom-6 right-6 z-50 print:hidden"
      >
        <div
          className={`absolute bottom-16 right-0 flex flex-col items-end gap-2 transition-all duration-200 ${
            menuAberto
              ? "translate-y-0 opacity-100"
              : "pointer-events-none translate-y-2 opacity-0"
          }`}
        >
          {OPCOES.map((opcao, i) => (
            <button
              key={opcao.key}
              type="button"
              onClick={() => abrir(opcao.key)}
              style={{ transitionDelay: menuAberto ? `${i * 25}ms` : "0ms" }}
              className="flex w-44 items-center gap-2.5 rounded-full border border-black/5 bg-white py-2 pl-3.5 pr-4 text-sm font-medium text-[#2D3230] shadow-lg transition-colors hover:border-[#24483F]"
            >
              <span className="text-base leading-none">{opcao.emoji}</span>
              <span>{opcao.label}</span>
            </button>
          ))}
        </div>

        <button
          type="button"
          aria-label="Captura rápida"
          aria-expanded={menuAberto}
          onClick={() => setMenuAberto((v) => !v)}
          className={`grid h-14 w-14 place-items-center rounded-full bg-[#24483F] text-white shadow-xl transition-all hover:bg-[#1c3a33] ${
            menuAberto ? "rotate-45" : ""
          }`}
        >
          <Plus className="h-7 w-7" strokeWidth={2.5} />
        </button>
      </div>

      {modal === "tarefa" && (
        <TarefaModalLoader
          onClose={fecharModal}
          onSuccess={() => concluir("tarefa")}
        />
      )}
      {modal === "ideia" && (
        <QuickIdeiaModal
          onClose={fecharModal}
          onSuccess={() => concluir("ideia")}
        />
      )}
      {modal === "nota" && (
        <QuickNoteModal
          onClose={fecharModal}
          onSuccess={() => concluir("nota")}
        />
      )}
      {modal === "evento" && (
        <QuickEventoModal
          onClose={fecharModal}
          onSuccess={() => concluir("evento")}
        />
      )}
      {modal === "receita" && (
        <QuickMovimentacaoModal
          tipo="receita"
          onClose={fecharModal}
          onSuccess={() => concluir("receita")}
        />
      )}
      {modal === "despesa" && (
        <QuickMovimentacaoModal
          tipo="despesa"
          onClose={fecharModal}
          onSuccess={() => concluir("despesa")}
        />
      )}
      {modal === "conteudo" && (
        <QuickConteudoModal
          onClose={fecharModal}
          onSuccess={() => concluir("conteudo")}
        />
      )}
      {modal === "link" && (
        <QuickLinkModal
          onClose={fecharModal}
          onSuccess={() => concluir("link")}
        />
      )}

      {toast && (
        <CapturaToast
          key={toast}
          label={TOAST_INFO[toast].label}
          href={TOAST_INFO[toast].href}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
}
