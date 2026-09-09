import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateCliente } from "../../actions";
import { ClienteForm } from "../../_components/cliente-form";

export default async function EditarClientePage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const { data: cliente } = await supabase
    .from("pessoas")
    .select("id, nome, email, telefone, origem, tipo, observacoes")
    .eq("id", params.id)
    .maybeSingle();

  if (!cliente) {
    notFound();
  }

  const action = updateCliente.bind(null, cliente.id as string);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href={`/dashboard/clientes/${cliente.id}`}
        className="text-sm text-gray-500 transition-colors hover:text-gray-700"
      >
        ← {cliente.nome}
      </Link>

      <h2 className="text-xl font-semibold text-[#24483F]">Editar cliente</h2>

      <div className="rounded-xl border border-black/5 bg-white p-6 shadow-sm">
        <ClienteForm
          action={action}
          cancelHref={`/dashboard/clientes/${cliente.id}`}
          submitLabel="Salvar alterações"
          defaults={{
            nome: cliente.nome ?? "",
            email: cliente.email ?? "",
            telefone: cliente.telefone ?? "",
            origem: cliente.origem ?? "",
            tipo: cliente.tipo ?? "",
            observacoes: cliente.observacoes ?? "",
          }}
        />
      </div>
    </div>
  );
}
