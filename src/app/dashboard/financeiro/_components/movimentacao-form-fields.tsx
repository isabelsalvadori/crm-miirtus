"use client";

import { useState } from "react";
import {
  ESCOPO_OPTIONS,
  FORMA_PAGAMENTO_OPTIONS,
  STATUS_DESPESA_FORM_OPTIONS,
  STATUS_RECEITA_FORM_OPTIONS,
  toDateInputValue,
} from "../constants";
import type { CategoriaLite, MovimentacaoFull, OptionLite } from "../types";
import { MoedaInput } from "./moeda-input";

const fieldClass =
  "mt-1 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-[#24483F] focus:ring-1 focus:ring-[#24483F]";
const labelClass = "block text-sm font-medium text-gray-700";
const errorClass = "mt-1 text-xs text-red-600";

export function MovimentacaoFormFields({
  tipo,
  mov,
  categorias,
  produtos,
  projetos,
  fieldErrors,
}: {
  tipo: "receita" | "despesa";
  mov: MovimentacaoFull | null;
  categorias: CategoriaLite[];
  produtos: OptionLite[];
  projetos: OptionLite[];
  fieldErrors?: Record<string, string>;
}) {
  const [escopo, setEscopo] = useState<string>(() => {
    if (mov?.produto_id) return "produto";
    if (mov?.projeto_id) return "projeto";
    return "geral";
  });

  const statusOptions =
    tipo === "despesa" ? STATUS_DESPESA_FORM_OPTIONS : STATUS_RECEITA_FORM_OPTIONS;

  return (
    <div className="grid gap-x-6 gap-y-4 md:grid-cols-5">
      <input type="hidden" name="tipo" value={tipo} />

      {/* Coluna esquerda (60%) */}
      <div className="space-y-4 md:col-span-3">
        <div>
          <label htmlFor="descricao" className={labelClass}>
            Descrição <span className="text-red-500">*</span>
          </label>
          <input
            id="descricao"
            name="descricao"
            type="text"
            required
            maxLength={300}
            defaultValue={mov?.descricao ?? ""}
            className={fieldClass}
          />
          {fieldErrors?.descricao && <p className={errorClass}>{fieldErrors.descricao}</p>}
        </div>

        <div>
          <label htmlFor="categoria_id" className={labelClass}>
            Categoria
          </label>
          <select
            id="categoria_id"
            name="categoria_id"
            defaultValue={mov?.categoria_id ?? ""}
            className={fieldClass}
          >
            <option value="">Sem categoria</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="valor" className={labelClass}>
            Valor (R$) <span className="text-red-500">*</span>
          </label>
          <MoedaInput
            id="valor"
            name="valor"
            defaultValue={mov?.valor}
            required
            className={fieldClass}
          />
          {fieldErrors?.valor && <p className={errorClass}>{fieldErrors.valor}</p>}
        </div>

        <div>
          <label htmlFor="observacoes" className={labelClass}>
            Observações
          </label>
          <textarea
            id="observacoes"
            name="observacoes"
            rows={4}
            defaultValue={mov?.observacoes ?? ""}
            className={fieldClass}
          />
        </div>

        <div>
          <label htmlFor="comprovante_url" className={labelClass}>
            Comprovante (URL)
          </label>
          <input
            id="comprovante_url"
            name="comprovante_url"
            type="url"
            placeholder="https://..."
            defaultValue={mov?.comprovante_url ?? ""}
            className={fieldClass}
          />
          <p className="mt-1 text-xs text-gray-400">
            Upload de arquivo chega depois — por ora, cole o link do comprovante.
          </p>
        </div>
      </div>

      {/* Coluna direita (40%) */}
      <div className="space-y-4 md:col-span-2">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="data_competencia" className={labelClass}>
              Competência
            </label>
            <input
              id="data_competencia"
              name="data_competencia"
              type="date"
              defaultValue={toDateInputValue(mov?.data_competencia)}
              className={fieldClass}
            />
          </div>
          <div>
            <label htmlFor="data_vencimento" className={labelClass}>
              Vencimento
            </label>
            <input
              id="data_vencimento"
              name="data_vencimento"
              type="date"
              defaultValue={toDateInputValue(mov?.data_vencimento)}
              className={fieldClass}
            />
          </div>
        </div>

        <div>
          <label htmlFor="status" className={labelClass}>
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={mov?.status ?? "previsto"}
            className={fieldClass}
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {fieldErrors?.status && <p className={errorClass}>{fieldErrors.status}</p>}
        </div>

        <div>
          <label htmlFor="forma_pagamento" className={labelClass}>
            Forma de pagamento
          </label>
          <select
            id="forma_pagamento"
            name="forma_pagamento"
            defaultValue={mov?.forma_pagamento ?? ""}
            className={fieldClass}
          >
            <option value="">Não informado</option>
            {FORMA_PAGAMENTO_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {tipo === "despesa" ? (
          <>
            <div>
              <span className={labelClass}>Escopo</span>
              <select
                value={escopo}
                onChange={(event) => setEscopo(event.target.value)}
                className={fieldClass}
                aria-label="Escopo da despesa"
              >
                {ESCOPO_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {escopo === "produto" && (
              <div>
                <label htmlFor="produto_id" className={labelClass}>
                  Produto relacionado
                </label>
                <select
                  id="produto_id"
                  name="produto_id"
                  defaultValue={mov?.produto_id ?? ""}
                  className={fieldClass}
                >
                  <option value="">Selecione</option>
                  {produtos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nome}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {escopo === "projeto" && (
              <div>
                <label htmlFor="projeto_id" className={labelClass}>
                  Projeto relacionado
                </label>
                <select
                  id="projeto_id"
                  name="projeto_id"
                  defaultValue={mov?.projeto_id ?? ""}
                  className={fieldClass}
                >
                  <option value="">Selecione</option>
                  {projetos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nome}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </>
        ) : (
          <>
            <div>
              <label htmlFor="produto_id" className={labelClass}>
                Produto relacionado
              </label>
              <select
                id="produto_id"
                name="produto_id"
                defaultValue={mov?.produto_id ?? ""}
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
                defaultValue={mov?.projeto_id ?? ""}
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
          </>
        )}
      </div>
    </div>
  );
}
