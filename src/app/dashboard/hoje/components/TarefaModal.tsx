"use client";

import { useCallback, useEffect, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import {
  criarTarefaDeHoje,
  type FormState,
  type OptionLite,
  type TagLite,
} from "../actions";
import {
  PRIORIDADE_OPTIONS,
  STATUS_OPTIONS,
} from "../../tarefas/constants";

const initialState: FormState = {};

const fieldClass =
  "mt-1 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-[#2D3230] outline-none transition focus:border-[#24483F] focus:ring-1 focus:ring-[#24483F]";
const labelClass = "block text-sm font-medium text-[#2D3230]";

function Spinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-2 rounded-lg bg-[#24483F] px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#1c3a33] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending && <Spinner />}
      {pending ? "Salvando..." : "Criar tarefa"}
    </button>
  );
}

function TagInput({
  disponiveis,
  selecionadas,
  novas,
  onToggle,
  onAdd,
  onRemoveNova,
}: {
  disponiveis: TagLite[];
  selecionadas: Set<string>;
  novas: string[];
  onToggle: (id: string) => void;
  onAdd: (nome: string) => void;
  onRemoveNova: (nome: string) => void;
}) {
  const [texto, setTexto] = useState("");

  function adicionar() {
    const nome = texto.trim();
    if (!nome) return;
    onAdd(nome);
    setTexto("");
  }

  return (
    <div>
      <span className={labelClass}>Tags</span>
      {disponiveis.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {disponiveis.map((tag) => {
            const ativa = selecionadas.has(tag.id);
            return (
              <button
                key={tag.id}
                type="button"
                onClick={() => onToggle(tag.id)}
                aria-pressed={ativa}
                className={`rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors ${
                  ativa
                    ? "border-[#24483F] bg-[#24483F] text-white"
                    : "border-black/10 bg-white text-[#2D3230] hover:border-[#24483F]/40"
                }`}
              >
                {tag.nome}
              </button>
            );
          })}
        </div>
      )}

      {novas.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {novas.map((nome) => (
            <button
              key={nome}
              type="button"
              onClick={() => onRemoveNova(nome)}
              className="rounded-full border border-[#E3BD62] bg-[#E3BD62]/15 px-2.5 py-0.5 text-xs font-medium text-[#2D3230]"
            >
              {nome} ×
            </button>
          ))}
        </div>
      )}

      <div className="mt-2 flex gap-2">
        <input
          type="text"
          value={texto}
          onChange={(event) => setTexto(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              adicionar();
            }
          }}
          placeholder="Nova tag"
          className="flex-1 rounded-lg border border-black/10 bg-white px-3 py-1.5 text-sm text-[#2D3230] outline-none transition focus:border-[#24483F] focus:ring-1 focus:ring-[#24483F]"
        />
        <button
          type="button"
          onClick={adicionar}
          className="rounded-lg border border-black/10 bg-white px-3 py-1.5 text-sm font-medium text-[#24483F] transition-colors hover:bg-[#24483F]/5"
        >
          Adicionar
        </button>
      </div>
    </div>
  );
}

type Props = {
  projetos: OptionLite[];
  produtos: OptionLite[];
  tags: TagLite[];
  temProdutoCol: boolean;
  onClose: () => void;
};

export function TarefaModal({
  projetos,
  produtos,
  tags,
  temProdutoCol,
  onClose,
}: Props) {
  const [mounted, setMounted] = useState(false);
  const [closing, setClosing] = useState(false);

  const [status, setStatus] = useState("a_fazer");
  const [prioridade, setPrioridade] = useState("normal");
  const [tagIds, setTagIds] = useState<Set<string>>(new Set());
  const [novasTags, setNovasTags] = useState<string[]>([]);

  const [state, formAction] = useFormState(criarTarefaDeHoje, initialState);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const close = useCallback(() => {
    setClosing(true);
    setTimeout(onClose, 160);
  }, [onClose]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") close();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [close]);

  useEffect(() => {
    if (state.ok) close();
  }, [state, close]);

  function toggleTag(id: string) {
    setTagIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const tagsJson = JSON.stringify([
    ...Array.from(tagIds).map((id) => ({ id })),
    ...novasTags.map((nome) => ({ nome })),
  ]);

  const show = mounted && !closing;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <div
        aria-hidden
        onClick={close}
        className={`absolute inset-0 bg-black/50 transition-opacity duration-200 ${
          show ? "opacity-100" : "opacity-0"
        }`}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Nova tarefa"
        className={`relative flex max-h-[90vh] w-full max-w-[860px] flex-col overflow-hidden rounded-xl bg-[#F5F1E8] shadow-xl transition-all duration-200 ${
          show ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
      >
        <header className="flex shrink-0 items-center justify-between border-b border-black/5 bg-white px-5 py-3">
          <h2 className="text-sm font-semibold text-[#24483F]">Nova tarefa</h2>
          <button
            type="button"
            onClick={close}
            aria-label="Fechar"
            className="grid h-8 w-8 place-items-center rounded-lg text-gray-500 transition-colors hover:bg-[#F5F1E8]"
          >
            ×
          </button>
        </header>

        <form
          action={formAction}
          className="flex-1 overflow-y-auto p-5"
          noValidate
        >
          <input type="hidden" name="status" value={status} />
          <input type="hidden" name="prioridade" value={prioridade} />
          <input type="hidden" name="tags_json" value={tagsJson} />

          {state.error && (
            <p
              role="alert"
              className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600"
            >
              {state.error}
            </p>
          )}

          <div className="grid gap-6 md:grid-cols-[1fr_280px]">
            <div className="space-y-4">
              <div>
                <label htmlFor="titulo" className={labelClass}>
                  Título <span className="text-[#B97059]">*</span>
                </label>
                <input
                  id="titulo"
                  name="titulo"
                  type="text"
                  required
                  maxLength={300}
                  autoFocus
                  className={fieldClass}
                />
                {state.fieldErrors?.titulo && (
                  <p className="mt-1 text-xs text-red-600">
                    {state.fieldErrors.titulo}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="descricao" className={labelClass}>
                  Descrição
                </label>
                <textarea
                  id="descricao"
                  name="descricao"
                  rows={6}
                  className={fieldClass}
                />
              </div>

              <TagInput
                disponiveis={tags}
                selecionadas={tagIds}
                novas={novasTags}
                onToggle={toggleTag}
                onAdd={(nome) =>
                  setNovasTags((prev) =>
                    prev.includes(nome) ? prev : [...prev, nome],
                  )
                }
                onRemoveNova={(nome) =>
                  setNovasTags((prev) => prev.filter((n) => n !== nome))
                }
              />
            </div>

            <div className="space-y-4">
              <div>
                <span className={labelClass}>Status</span>
                <div className="mt-1.5 space-y-1.5">
                  {STATUS_OPTIONS.map((option) => {
                    const ativo = status === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setStatus(option.value)}
                        aria-pressed={ativo}
                        className={`w-full rounded-lg border px-3 py-2 text-left text-sm font-medium transition-colors ${
                          ativo
                            ? "border-[#24483F] bg-[#24483F] text-white"
                            : "border-black/10 bg-white text-[#2D3230] hover:border-[#24483F]/40"
                        }`}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <span className={labelClass}>Prioridade</span>
                <div className="mt-1.5 grid grid-cols-2 gap-1 rounded-lg border border-black/10 bg-white p-1">
                  {PRIORIDADE_OPTIONS.map((option) => {
                    const ativo = prioridade === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setPrioridade(option.value)}
                        aria-pressed={ativo}
                        className={`rounded-md px-2 py-1.5 text-xs font-semibold transition-colors ${
                          ativo
                            ? "bg-[#E3BD62] text-[#2D3230]"
                            : "text-gray-500 hover:bg-[#F5F1E8]"
                        }`}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label htmlFor="data_prazo" className={labelClass}>
                  Data prazo
                </label>
                <input
                  id="data_prazo"
                  name="data_prazo"
                  type="date"
                  className={fieldClass}
                />
              </div>

              <div>
                <label htmlFor="projeto_id" className={labelClass}>
                  Projeto
                </label>
                <select
                  id="projeto_id"
                  name="projeto_id"
                  defaultValue=""
                  className={fieldClass}
                >
                  <option value="">Sem vínculo</option>
                  {projetos.map((projeto) => (
                    <option key={projeto.id} value={projeto.id}>
                      {projeto.nome}
                    </option>
                  ))}
                </select>
              </div>

              {temProdutoCol && (
                <div>
                  <label htmlFor="produto_id" className={labelClass}>
                    Produto
                  </label>
                  <select
                    id="produto_id"
                    name="produto_id"
                    defaultValue=""
                    className={fieldClass}
                  >
                    <option value="">Sem vínculo</option>
                    {produtos.map((produto) => (
                      <option key={produto.id} value={produto.id}>
                        {produto.nome}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3 border-t border-black/5 pt-4">
            <SubmitButton />
            <button
              type="button"
              onClick={close}
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-white"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
