import { createClient } from "@/lib/supabase/server";
import { carregarCatalogos, carregarDocumentos } from "../db";
import { DocumentosList } from "./components/DocumentosList";

export default async function BibliotecaProdutosPage() {
  const supabase = createClient();
  const [{ itens, error }, catalogos] = await Promise.all([
    carregarDocumentos(supabase, "biblioteca_produto"),
    carregarCatalogos(supabase),
  ]);

  if (error) {
    return (
      <div className="rounded-xl border border-black/5 bg-white p-6 text-sm text-red-600 shadow-sm">
        Não foi possível carregar os documentos. Recarregue a página.
      </div>
    );
  }

  return <DocumentosList documentos={itens} catalogos={catalogos} />;
}
