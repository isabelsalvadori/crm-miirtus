import Link from "next/link";
import { createCliente } from "../actions";
import { ClienteForm } from "../_components/cliente-form";

export default function NovoClientePage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href="/dashboard/clientes"
        className="text-sm text-gray-500 transition-colors hover:text-gray-700"
      >
        ← Clientes
      </Link>

      <div>
        <h2 className="text-xl font-semibold text-[#24483F]">Novo cliente</h2>
        <p className="mt-1 text-sm text-gray-500">
          Preencha os dados. Apenas o nome é obrigatório.
        </p>
      </div>

      <div className="rounded-xl border border-black/5 bg-white p-6 shadow-sm">
        <ClienteForm
          action={createCliente}
          cancelHref="/dashboard/clientes"
          submitLabel="Salvar"
        />
      </div>
    </div>
  );
}
