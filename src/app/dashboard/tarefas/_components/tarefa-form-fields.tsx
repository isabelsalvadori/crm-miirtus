"use client";

import { useState } from "react";
import {
  PRIORIDADE_OPTIONS,
  STATUS_OPTIONS,
  toDateInputValue,
  toDateTimeLocalValue,
} from "../constants";
import type { OptionLite, SubtarefaItem, TagLite, TarefaFull } from "../types";
import { TagInput, type DraftTag } from "./tag-input";
import { SubtarefasEditor, type DraftSubtarefa } from "./subtarefas-editor";

const fieldClass =
  "mt-1 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-[#24483F] focus:ring-1 focus:ring-[#24483F]";
const labelClass = "block text-sm font-medium text-gray-700";
const errorClass = "mt-1 text-xs text-red-600";

export type TarefaCaps = {
  agenda: boolean;
  observacoes: boolean;
  produto: boolean;
};

export function TarefaFormFields({
  tarefa,
  subtarefas,
  produtos,
  projetos,
  tags,
  caps,
  defaultStatus,
  fieldErrors,
}: {
  tarefa: TarefaFull | null;
  subtarefas: SubtarefaItem[];
  produtos: OptionLite[];
  projetos: OptionLite[];
  tags: TagLite[];
  caps: TarefaCaps;
  defaultStatus?: string;
  fieldErrors?: Record<string, string>;
}) {
  const [draftTags, setDraftTags] = useState<DraftTag[]>(
    (tarefa?.tags ?? []).map((t) => ({
      id: t.id,
      nome: t.nome,
      cor: t.cor ?? "#e5e7eb",
    })),
  );
  const [draftSubs, setDraftSubs] = useState<DraftSubtarefa[]>(
    subtarefas.map((s) => ({
      id: s.id,
      titulo: s.titulo,
      concluida: s.status === "concluida",
    })),
  );
  const [naAgenda, setNaAgenda] = useState(Boolean(tarefa?.na_agenda));

  return (
    <div className="space-y-4">
      <input type="hidden" name="tags_json" value={JSON.stringify(draftTags)} />
      <input
        type="hidden"
        name="subtarefas_json"
        value={JSON.stringify(draftSubs)}
      />

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
        {fieldErrors?.titulo && <p className={errorClass}>{fieldErrors.titulo}</p>}
      </div>

      <div>
        <label htmlFor="descricao" className={labelClass}>
          Descrição
        </label>
        <textarea
          id="descricao"
          name="descricao"
          rows={3}
          defaultValue={tarefa?.descricao ?? ""}
          className={fieldClass}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
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
            disabled={!caps.agenda}
            className="h-4 w-4 rounded border-gray-300 text-[#24483F] focus:ring-[#24483F]"
          />
          Adicionar à agenda
        </label>
        {!caps.agenda && (
          <p className="mt-1 text-xs text-gray-400">
            Disponível após aplicar a migração 0003.
          </p>
        )}
        {caps.agenda && naAgenda && (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="agenda_inicio" className="text-xs text-gray-500">
                Início
              </label>
              <input
                id="agenda_inicio"
                name="agenda_inicio"
                type="datetime-local"
                defaultValue={toDateTimeLocalValue(tarefa?.agenda_inicio)}
                className={fieldClass}
              />
              {fieldErrors?.agenda_inicio && (
                <p className={errorClass}>{fieldErrors.agenda_inicio}</p>
              )}
            </div>
            <div>
              <label htmlFor="agenda_fim" className="text-xs text-gray-500">
                Fim
              </label>
              <input
                id="agenda_fim"
                name="agenda_fim"
                type="datetime-local"
                defaultValue={toDateTimeLocalValue(tarefa?.agenda_fim)}
                className={fieldClass}
              />
            </div>
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="produto_id" className={labelClass}>
            Produto relacionado
          </label>
          <select
            id="produto_id"
            name="produto_id"
            defaultValue={tarefa?.produto_id ?? ""}
            disabled={!caps.produto}
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
      </div>

      <div>
        <span className={labelClass}>Tags</span>
        <div className="mt-1">
          <TagInput value={draftTags} onChange={setDraftTags} allTags={tags} />
        </div>
      </div>

      <div>
        <label htmlFor="observacoes" className={labelClass}>
          Observações
        </label>
        <textarea
          id="observacoes"
          name="observacoes"
          rows={2}
          defaultValue={tarefa?.observacoes ?? ""}
          disabled={!caps.observacoes}
          className={fieldClass}
        />
        {!caps.observacoes && (
          <p className="mt-1 text-xs text-gray-400">
            Disponível após aplicar a migração 0003 (coluna observacoes).
          </p>
        )}
      </div>

      <div>
        <span className={labelClass}>Subtarefas</span>
        <div className="mt-1">
          <SubtarefasEditor value={draftSubs} onChange={setDraftSubs} />
        </div>
      </div>
    </div>
  );
}
