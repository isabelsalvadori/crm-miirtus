"use client";

import { useState } from "react";
import {
  PRIORIDADE_OPTIONS,
  STATUS_OPTIONS,
  toDateInputValue,
  toTimeInputValue,
} from "../constants";
import type { OptionLite, SubtarefaItem, TagLite, TarefaFull } from "../types";
import { TagInput, type DraftTag } from "./tag-input";
import { SubtarefasEditor, type DraftSubtarefa } from "./subtarefas-editor";

const fieldClass =
  "mt-1 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-[#24483F] focus:ring-1 focus:ring-[#24483F]";
const labelClass = "block text-sm font-medium text-gray-700";
const errorClass = "mt-1 text-xs text-red-600";

export function TarefaFormFields({
  tarefa,
  subtarefas,
  produtos,
  projetos,
  tags,
  defaultStatus,
  fieldErrors,
}: {
  tarefa: TarefaFull | null;
  subtarefas: SubtarefaItem[];
  produtos: OptionLite[];
  projetos: OptionLite[];
  tags: TagLite[];
  defaultStatus?: string;
  fieldErrors?: Record<string, string>;
}) {
  const [draftTags, setDraftTags] = useState<DraftTag[]>(
    (tarefa?.tags ?? []).map((t) => ({
      id: t.id,
      nome: t.nome,
      cor: t.cor ?? "#6B7280",
    })),
  );
  const [draftSubs, setDraftSubs] = useState<DraftSubtarefa[]>(
    subtarefas.map((s) => ({
      id: s.id,
      titulo: s.titulo,
      concluida: s.status === "concluida",
    })),
  );
  const [naAgenda, setNaAgenda] = useState(Boolean(tarefa?.agenda_data));

  return (
    <div className="grid gap-x-6 gap-y-4 md:grid-cols-5">
      <input type="hidden" name="tags_json" value={JSON.stringify(draftTags)} />
      <input
        type="hidden"
        name="subtarefas_json"
        value={JSON.stringify(draftSubs)}
      />

      {/* Coluna esquerda (60%) */}
      <div className="space-y-4 md:col-span-3">
        <div>
          <label htmlFor="titulo" className={labelClass}>
            Título <span className="text-red-500">*</span>
          </label>
          <input
            id="titulo"
            name="titulo"
            type="text"
            required
            maxLength={300}
            defaultValue={tarefa?.titulo ?? ""}
            className={fieldClass}
          />
          {fieldErrors?.titulo && (
            <p className={errorClass}>{fieldErrors.titulo}</p>
          )}
        </div>

        <div>
          <label htmlFor="descricao" className={labelClass}>
            Descrição
          </label>
          <textarea
            id="descricao"
            name="descricao"
            rows={4}
            defaultValue={tarefa?.descricao ?? ""}
            className={fieldClass}
          />
        </div>

        <div>
          <label htmlFor="observacoes" className={labelClass}>
            Observações
          </label>
          <textarea
            id="observacoes"
            name="observacoes"
            rows={3}
            defaultValue={tarefa?.observacoes ?? ""}
            className={fieldClass}
          />
        </div>

        <div>
          <span className={labelClass}>Subtarefas</span>
          <div className="mt-1">
            <SubtarefasEditor value={draftSubs} onChange={setDraftSubs} />
          </div>
        </div>
      </div>

      {/* Coluna direita (40%) */}
      <div className="space-y-4 md:col-span-2">
        <div>
          <label htmlFor="status" className={labelClass}>
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={tarefa?.status ?? defaultStatus ?? "a_fazer"}
            className={fieldClass}
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="prioridade" className={labelClass}>
            Prioridade
          </label>
          <select
            id="prioridade"
            name="prioridade"
            defaultValue={tarefa?.prioridade ?? "normal"}
            className={fieldClass}
          >
            {PRIORIDADE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="data_prazo" className={labelClass}>
            Prazo
          </label>
          <input
            id="data_prazo"
            name="data_prazo"
            type="date"
            defaultValue={toDateInputValue(tarefa?.data_prazo)}
            className={fieldClass}
          />
        </div>

        <div className="rounded-lg border border-black/10 p-3">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <input
              type="checkbox"
              name="na_agenda"
              checked={naAgenda}
              onChange={(event) => setNaAgenda(event.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-[#24483F] focus:ring-[#24483F]"
            />
            Adicionar à agenda
          </label>

          {naAgenda && (
            <div className="mt-3 space-y-3">
              <div>
                <label htmlFor="agenda_data" className="text-xs text-gray-500">
                  Data
                </label>
                <input
                  id="agenda_data"
                  name="agenda_data"
                  type="date"
                  defaultValue={toDateInputValue(tarefa?.agenda_data)}
                  className={fieldClass}
                />
                {fieldErrors?.agenda_data && (
                  <p className={errorClass}>{fieldErrors.agenda_data}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="agenda_hora_inicio"
                    className="text-xs text-gray-500"
                  >
                    Início
                  </label>
                  <input
                    id="agenda_hora_inicio"
                    name="agenda_hora_inicio"
                    type="time"
                    defaultValue={toTimeInputValue(tarefa?.agenda_hora_inicio)}
                    className={fieldClass}
                  />
                </div>
                <div>
                  <label
                    htmlFor="agenda_hora_fim"
                    className="text-xs text-gray-500"
                  >
                    Fim
                  </label>
                  <input
                    id="agenda_hora_fim"
                    name="agenda_hora_fim"
                    type="time"
                    defaultValue={toTimeInputValue(tarefa?.agenda_hora_fim)}
                    className={fieldClass}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div>
          <label htmlFor="produto_id" className={labelClass}>
            Produto relacionado
          </label>
          <select
            id="produto_id"
            name="produto_id"
            defaultValue={tarefa?.produto_id ?? ""}
            className={fieldClass}
          >
            <option value="">Nenhum</option>
            {produtos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="projeto_id" className={labelClass}>
            Projeto relacionado
          </label>
          <select
            id="projeto_id"
            name="projeto_id"
            defaultValue={tarefa?.projeto_id ?? ""}
            className={fieldClass}
          >
            <option value="">Nenhum</option>
            {projetos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </select>
        </div>

        <div>
          <span className={labelClass}>Tags</span>
          <div className="mt-1">
            <TagInput value={draftTags} onChange={setDraftTags} allTags={tags} />
          </div>
        </div>
      </div>
    </div>
  );
}
