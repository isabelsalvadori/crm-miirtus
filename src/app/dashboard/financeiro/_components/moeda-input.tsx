"use client";

import { useState } from "react";
import { formatCurrency } from "../constants";

function apenasDigitos(value: string): string {
  return value.replace(/\D/g, "");
}

function digitosParaNumero(digitos: string): number {
  if (!digitos) return 0;
  return Number(digitos) / 100;
}

/**
 * Campo de valor em reais com máscara "R$ 1.234,56" enquanto digita.
 * O que aparece na tela é só exibição — o valor de fato submetido no form
 * vai num input escondido, sempre como decimal limpo ("1234.56").
 */
export function MoedaInput({
  id,
  name,
  defaultValue,
  required,
  className,
}: {
  id: string;
  name: string;
  defaultValue?: number | null;
  required?: boolean;
  className?: string;
}) {
  const [digitos, setDigitos] = useState<string>(() =>
    defaultValue ? String(Math.round(defaultValue * 100)) : "",
  );
  const numero = digitosParaNumero(digitos);

  return (
    <>
      <input
        id={id}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        required={required}
        placeholder="R$ 0,00"
        value={digitos ? formatCurrency(numero) : ""}
        onChange={(event) => setDigitos(apenasDigitos(event.target.value))}
        className={className}
      />
      <input type="hidden" name={name} value={numero ? numero.toFixed(2) : ""} />
    </>
  );
}
