import {
  BarChart3,
  BookOpen,
  Calendar,
  CalendarCheck,
  CalendarDays,
  CheckSquare,
  DollarSign,
  FileText,
  Folder,
  Home,
  Lightbulb,
  Megaphone,
  Package,
  Target,
  Users,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export type NavGroup = {
  title: string;
  items: NavItem[];
};

/**
 * Estrutura de navegação da área autenticada.
 * A ordem dos grupos e itens é a exibida na sidebar.
 */
export const navGroups: NavGroup[] = [
  {
    title: "Núcleo",
    items: [
      { label: "Início", href: "/dashboard", icon: Home },
      { label: "Hoje", href: "/dashboard/hoje", icon: CalendarCheck },
    ],
  },
  {
    title: "Gestão",
    items: [
      { label: "Projetos", href: "/dashboard/projetos", icon: Folder },
      { label: "Produtos", href: "/dashboard/produtos", icon: Package },
      { label: "Eventos", href: "/dashboard/eventos", icon: Calendar },
      { label: "Clientes", href: "/dashboard/clientes", icon: Users },
      { label: "Ideias", href: "/dashboard/ideias", icon: Lightbulb },
      { label: "Metas", href: "/dashboard/metas", icon: Target },
    ],
  },
  {
    title: "Execução",
    items: [
      { label: "Tarefas", href: "/dashboard/tarefas", icon: CheckSquare },
      { label: "Agenda", href: "/dashboard/agenda", icon: CalendarDays },
      { label: "Notas", href: "/dashboard/notas", icon: FileText },
    ],
  },
  {
    title: "Marketing",
    items: [
      { label: "Marketing", href: "/dashboard/marketing", icon: Megaphone },
    ],
  },
  {
    title: "Financeiro",
    items: [
      { label: "Financeiro", href: "/dashboard/financeiro", icon: DollarSign },
      { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
    ],
  },
  {
    title: "Conhecimento",
    items: [
      { label: "Biblioteca", href: "/dashboard/biblioteca", icon: BookOpen },
    ],
  },
];

const allItems: NavItem[] = navGroups.flatMap((group) => group.items);

/**
 * Verdadeiro quando o item de navegação corresponde à rota atual.
 * "/dashboard" (Início) exige match exato; os demais aceitam sub-rotas.
 */
export function isActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") {
    return pathname === "/dashboard";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Título da página atual, derivado da rota. Usa o match mais específico.
 */
export function getPageTitle(pathname: string): string {
  const match = allItems
    .filter(
      (item) =>
        pathname === item.href || pathname.startsWith(`${item.href}/`),
    )
    .sort((a, b) => b.href.length - a.href.length)[0];

  return match?.label ?? "MIIRTUS OS";
}
