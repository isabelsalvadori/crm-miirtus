import { createClient } from "@/lib/supabase/server";
import { fluxoDeCaixa } from "../db";
import { FinanceiroTabs } from "../_components/tabs";
import { FluxoCaixaTable } from "../_components/fluxo-caixa-table";

export default async function FluxoDeCaixaPage() {
  const supabase = createClient();
  const meses = await fluxoDeCaixa(supabase);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-[#24483F]">Financeiro</h2>
        <p className="mt-1 text-sm text-gray-500">
          Janeiro deste ano até 6 meses à frente — previsto vs. realizado.
        </p>
      </div>

      <FinanceiroTabs />

      <div className="rounded-xl border border-black/5 bg-white shadow-sm">
        <FluxoCaixaTable meses={meses} />
      </div>
    </div>
  );
}
