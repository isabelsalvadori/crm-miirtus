import { redirect } from "next/navigation";

export default function Home() {
  // O middleware redireciona visitantes não autenticados para /login.
  // Autenticados que chegam na raiz vão direto para o dashboard.
  redirect("/dashboard");
}
