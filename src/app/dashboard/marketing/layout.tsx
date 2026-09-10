import { MarketingTabs } from "./components/MarketingTabs";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-[#24483F]">Marketing</h1>
        <p className="mt-1 text-sm text-gray-500">
          Conteúdo, calendário editorial, campanhas e ações orgânicas.
        </p>
        <div className="mt-4">
          <MarketingTabs />
        </div>
      </div>
      {children}
    </div>
  );
}
