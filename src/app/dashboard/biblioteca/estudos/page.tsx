import { createClient } from "@/lib/supabase/server";
import { carregarCatalogos, carregarDocumentos } from "../db";
import { EstudosList } from "./components/EstudosList";

export default async function BibliotecaEstudosPage() {
  const supabase = createClient();
  const [{ itens, error }, catalogos] = await Promise.all([
    carregarDocumentos(supabase, "biblioteca_estudo"),
    carregarCatalogos(supabase),
  ]);

  if (error) {
    return (
      <div className="rounded-xl border border-black/5 bg-white p-6 text-sm text-red-600 shadow-sm">
        Não foi possível carregar os estudos. Recarregue a página.
      </div>
    );
  }

  return <EstudosList documentos={itens} catalogos={catalogos} />;
}
