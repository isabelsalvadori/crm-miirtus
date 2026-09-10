"use client";

import { useEffect, useState } from "react";
import { TarefaModal } from "@/app/dashboard/hoje/components/TarefaModal";
import type { FormState, VinculoTipo } from "@/app/dashboard/hoje/actions";
import {
  type ContextoTarefa,
  carregarContextoTarefa,
} from "@/app/dashboard/_captura/tarefa-contexto";
import { type QuickModalProps, QuickModalShell, useQuickModal } from "./shared";

type TarefaModalLoaderProps = QuickModalProps & {
  /** Pré-seleção de vínculos ao criar (ex.: perfil de Cliente/Produto). */
  vinculosPadrao?: Partial<Record<VinculoTipo, string>>;
  /** Sobrescreve a action de criação (ex.: criação vinculada a um perfil). */
  createAction?: (prev: FormState, fd: FormData) => Promise<FormState>;
};

/**
 * Carrega os catálogos que o `TarefaModal` exige e só então o renderiza.
 * Enquanto isso mostra um placeholder no mesmo formato dos demais modais.
 */
export function TarefaModalLoader({
  onClose,
  onSuccess,
  vinculosPadrao,
  createAction,
}: TarefaModalLoaderProps) {
  const [ctx, setCtx] = useState<ContextoTarefa | null>(null);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    let vivo = true;
    carregarContextoTarefa()
      .then((c) => {
        if (vivo) setCtx(c);
      })
      .catch(() => {
        if (vivo) setErro(true);
      });
    return () => {
      vivo = false;
    };
  }, []);

  if (ctx && !erro) {
    return (
      <TarefaModal
        tarefa={null}
        vinculos={ctx.vinculos}
        tags={ctx.tags}
        colunas={ctx.colunas}
        vinculosPadrao={vinculosPadrao}
        createAction={createAction}
        onClose={onClose}
        onSuccess={onSuccess}
      />
    );
  }

  return <Placeholder erro={erro} onClose={onClose} />;
}

function Placeholder({
  erro,
  onClose,
}: {
  erro: boolean;
  onClose: () => void;
}) {
  const { show, close } = useQuickModal(onClose);
  return (
    <QuickModalShell titulo="Nova tarefa" show={show} onClose={close}>
      <div className="p-8 text-center text-sm text-gray-500">
        {erro
          ? "Não foi possível carregar o formulário. Feche e tente de novo."
          : "Carregando..."}
      </div>
    </QuickModalShell>
  );
}
