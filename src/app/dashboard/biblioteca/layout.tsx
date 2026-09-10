import { BibliotecaTabs } from "./components/BibliotecaTabs";

export default function BibliotecaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-[#24483F]">Biblioteca</h1>
        <p className="mt-1 text-sm text-gray-500">
          Materiais dos produtos, estudos de referência e acervo de links.
        </p>
        <div className="mt-4">
          <BibliotecaTabs />
        </div>
      </div>
      {children}
    </div>
  );
}
