"use client";

import { useEffect, useMemo } from "react";
import { useFormState } from "react-dom";
import {
  atualizarDocumento,
  criarDocumento,
  type FormState,
} from "../../actions";
import { PRODUTO_TIPO_OPTIONS } from "../../constants";
import {
  DangerActions,
  SubmitButton,
  fieldClass,
  labelClass,
  useModalChrome,
} from "../../components/modal-parts";
import { TagField } from "../../components/TagField";
import type { Catalogos, DocumentoItem } from "../../types";

const ENTIDADE = "biblioteca_produto";
const initialState: FormState = {};

export function DocumentoModal({
  documento,
  catalogos,
  onClose,
}: {
  documento: DocumentoItem | null;
  catalogos: Catalogos;
  onClose: () => void;
}) {
  const { show, close } = useModalChrome(onClose);

  const action = useMemo(
    () =>
      documento
        ? atualizarDocumento.bind(null, documento.id)
        : criarDocumento.bind(null, ENTIDADE),
    [documento],
  );
  const [state, formAction] = useFormState(action, initialState);

  useEffect(() => {
    if (state.ok) close();
  }, [state, close]);

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
        aria-label={documento ? "Editar documento" : "Novo documento"}
        className={`relative flex max-h-[90vh] w-full max-w-[860px] flex-col overflow-hidden rounded-xl bg-[#F5F1E8] shadow-xl transition-all duration-200 ${
          show ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
      >
        <header className="flex shrink-0 items-center justify-between border-b border-black/5 bg-white px-5 py-3">
          <h2 className="text-sm font-semibold text-[#24483F]">
            {documento ? "Editar documento" : "Adicionar documento"}
          </h2>
          <button
            type="button"
            onClick={close}
            aria-label="Fechar"
            className="grid h-8 w-8 place-items-center rounded-lg text-gray-500 transition-colors hover:bg-[#F5F1E8]"
          >
            ×
          </button>
        </header>

        <form action={formAction} className="flex-1 overflow-y-auto p-5" noValidate>
          <input type="hidden" name="url_obrigatoria" value="1" />
          <input type="hidden" name="entidade_tipo" value={ENTIDADE} />

          {state.error && (
            <p role="alert" className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
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
                  maxLength={200}
                  autoFocus
                  defaultValue={documento?.titulo ?? ""}
                  className={fieldClass}
                />
                {state.fieldErrors?.titulo && (
                  <p className="mt-1 text-xs text-red-600">{state.fieldErrors.titulo}</p>
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
                  defaultValue={documento?.descricao ?? ""}
                  className={fieldClass}
                />
              </div>

              <div>
                <label htmlFor="url" className={labelClass}>
                  URL ou link do Drive <span className="text-[#B97059]">*</span>
                </label>
                <input
                  id="url"
                  name="url"
                  type="url"
                  required
                  defaultValue={documento?.url ?? ""}
                  placeholder="https://"
                  className={fieldClass}
                />
                {state.fieldErrors?.url && (
                  <p className="mt-1 text-xs text-red-600">{state.fieldErrors.url}</p>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="tipo" className={labelClass}>
                  Tipo
                </label>
                <select
                  id="tipo"
                  name="tipo"
                  defaultValue={documento?.tipo ?? "material"}
                  className={fieldClass}
                >
                  {PRODUTO_TIPO_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="produto_id" className={labelClass}>
                  Produto relacionado
                </label>
                <select
                  id="produto_id"
                  name="produto_id"
                  defaultValue={documento?.produto_id ?? ""}
                  className={fieldClass}
                >
                  <option value="">Nenhum</option>
                  {catalogos.produtos.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.nome}
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
                  defaultValue={documento?.projeto_id ?? ""}
                  className={fieldClass}
                >
                  <option value="">Nenhum</option>
                  {catalogos.projetos.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <span className={labelClass}>Tags</span>
                <div className="mt-1">
                  <TagField
                    initial={documento?.tags ?? []}
                    sugestoes={catalogos.tags}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3 border-t border-black/5 pt-4">
            <SubmitButton label={documento ? "Salvar alterações" : "Adicionar documento"} />
            <button
              type="button"
              onClick={close}
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-white"
            >
              Cancelar
            </button>
          </div>
        </form>

        {documento && (
          <DangerActions
            documentoId={documento.id}
            entidadeTipo={ENTIDADE}
            onDone={close}
          />
        )}
      </div>
    </div>
  );
}
