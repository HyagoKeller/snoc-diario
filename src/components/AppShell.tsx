import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import {
  ClipboardCheck,
  Repeat2,
  ShieldCheck,
  Wrench,
  LayoutDashboard,
  Settings,
  FileText,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { ROLE_LABEL } from "@/lib/snoc";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import aguServicosLogo from "@/assets/aguservicos.png.asset.json";

const NAV = [
  { to: "/painel", label: "Painel", icon: LayoutDashboard, need: "all" },
  { to: "/rondas", label: "Rondas", icon: ClipboardCheck, need: "all" },
  { to: "/passagens", label: "Passagem de turno", icon: Repeat2, need: "all" },
  { to: "/terceiros", label: "Terceiros", icon: ShieldCheck, need: "all" },
  { to: "/atividades", label: "Atividades / OS", icon: Wrench, need: "all" },
  { to: "/relatorios", label: "Relatórios", icon: FileText, need: "manager" },
  { to: "/admin", label: "Administração", icon: Settings, need: "admin" },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { profile, role, isManager, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const items = NAV.filter(
    (i) => i.need === "all" || (i.need === "manager" && isManager) || (i.need === "admin" && isAdmin),
  );

  async function sair() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="flex min-h-screen flex-col">
      <div className="faixa-gov" />
      <div className="flex items-center gap-3 bg-topbar px-4 py-3 text-topbar-foreground shadow-md">
        <img src={aguServicosLogo.url} alt="AGU Serviços" className="size-6 shrink-0 rounded-full" />
        <p className="font-display truncate text-sm font-semibold sm:text-base">
          SNOC — Diário de Bordo Operacional
        </p>
        <span className="ml-auto hidden items-center gap-4 text-xs opacity-90 sm:flex">
          <Link to="/manual" className="hover:underline">
            Manual
          </Link>
          <Link to="/faq" className="hover:underline">
            FAQ
          </Link>
          <span className="opacity-80">DTI-AGU</span>
        </span>
      </div>

      <div className="flex min-h-0 flex-1">
        <aside className="sticky top-0 hidden h-[calc(100vh-3.75rem)] w-64 shrink-0 flex-col self-start border-r border-sidebar-border bg-sidebar p-4 lg:flex">


        <Link to="/painel" className="flex items-center gap-3 px-2 py-3">
<div className="flex size-10 items-center justify-center overflow-hidden rounded-md bg-primary/15">
            <img src={aguServicosLogo.url} alt="AGU Serviços" className="size-8 rounded-full" />
          </div>
          <div>
            <p className="font-display leading-none font-bold">SNOC</p>
            <p className="label-mono">DTI-AGU</p>
          </div>
        </Link>

        <nav className="mt-6 flex flex-1 flex-col gap-1">
          {items.map((item) => {
            const active = pathname === item.to || pathname.startsWith(item.to + "/");
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                )}
              >
                <item.icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-sidebar-border pt-4">
          <p className="truncate text-sm font-medium">{profile?.nome || "Usuário"}</p>
          <p className="label-mono">{role ? ROLE_LABEL[role] : "sem papel"}</p>
          <Button variant="ghost" size="sm" className="mt-3 w-full justify-start" onClick={sair}>
            <LogOut className="size-4" /> Sair
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <nav className="flex items-center gap-1 overflow-x-auto border-b border-border px-2 py-2 lg:hidden">
          {items.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="rounded-md px-3 py-1.5 text-xs whitespace-nowrap text-muted-foreground hover:bg-accent"
            >
              {item.label}
            </Link>
          ))}
          <Button variant="ghost" size="sm" className="ml-auto" onClick={sair}>
            <LogOut className="size-4" />
          </Button>
        </nav>
        <main className="min-w-0 flex-1 p-4 sm:p-6">{children}</main>
      </div>
      </div>
    </div>
  );

}
