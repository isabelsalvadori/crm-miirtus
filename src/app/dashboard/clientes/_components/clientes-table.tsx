import Link from "next/link";
import { formatDate, origemLabel } from "../constants";
import { StatusBadge } from "./status-badge";

export type ClienteRow = {
  id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  origem: string | null;
  tipo: string | null;
  created_at: string;
};

export function ClientesTable({ clientes }: { clientes: ClienteRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-sm">
        <thead>
          <tr className="border-b border-black/5 text-left text-xs uppercase tracking-wide text-gray-500">
            <th className="px-4 py-3 font-medium">Nome</th>
            <th className="px-4 py-3 font-medium">E-mail</th>
            <th className="px-4 py-3 font-medium">Telefone</th>
            <th className="px-4 py-3 font-medium">Origem</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Criado em</th>
          </tr>
        </thead>
        <tbody>
          {clientes.map((cliente) => (
            <tr
              key={cliente.id}
              className="relative border-b border-black/5 transition-colors last:border-0 hover:bg-[#F5F1E8]"
            >
              <td className="px-4 py-3 font-medium text-gray-900">
                <Link
                  href={`/dashboard/clientes/${cliente.id}`}
                  className="absolute inset-0"
                  aria-label={cliente.nome}
                />
                <span className="relative">{cliente.nome}</span>
              </td>
              <td className="px-4 py-3 text-gray-600">{cliente.email || "—"}</td>
              <td className="px-4 py-3 text-gray-600">
                {cliente.telefone || "—"}
              </td>
              <td className="px-4 py-3 text-gray-600">
                {origemLabel(cliente.origem)}
              </td>
              <td className="px-4 py-3">
                <StatusBadge value={cliente.tipo} />
              </td>
              <td className="px-4 py-3 text-gray-600">
                {formatDate(cliente.created_at)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
