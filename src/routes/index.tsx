import { createFileRoute, Link } from "@tanstack/react-router";
import { Activity, LogIn, Lock, HelpCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import aguLogo from "@/assets/agu.png.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SNOC | Acesso institucional — DTI-AGU" },
      {
        name: "description",
        content:
          "Diário de bordo operacional do SNOC da AGU: rondas, passagem de turno, gestão de acesso de terceiros e ordens de serviço. Acesso restrito à equipe do SNOC.",
      },
      { property: "og:title", content: "SNOC — acesso institucional" },
      {
        property: "og:description",
        content: "Diário de bordo operacional do SNOC. Acesso restrito e monitorado.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { session } = useAuth();

  return (
    <main className="flex min-h-screen flex-col">
      <div className="faixa-gov" />

      <header className="border-b border-border">
        <div className="mx-auto grid max-w-5xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-6 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <img
              src={aguLogo.url}
              alt="Advocacia-Geral da União"
              className="h-9 w-auto rounded-sm bg-white/95 px-2 py-1"
            />
            <p className="label-mono truncate">Advocacia-Geral da União · SGG · DTI-CSI</p>
          </div>
          <Link
            to="/faq"
            className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <HelpCircle className="size-4" /> Dúvidas / FAQ
          </Link>
        </div>
      </header>

      <section className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center px-6 py-14 text-center">
        <div className="flex size-14 items-center justify-center rounded-md bg-primary/15 text-primary">
          <Activity className="size-7" />
        </div>

        <p className="label-mono mt-6">Secretaria de Governança e Gestão Estratégica</p>
        <p className="label-mono">DTI — Coordenação de Segurança da Informação</p>

        <h1 className="mt-4 text-4xl font-bold text-primary sm:text-5xl">SNOC</h1>
        <p className="mt-4 max-w-xl text-sm text-muted-foreground sm:text-base">
          Diário de bordo operacional: rondas, passagem de turno, gestão de acesso de terceiros e
          ordens de serviço.
        </p>

        <div className="panel mt-10 w-full max-w-sm overflow-hidden text-center">
          <div className="faixa-gov" />
          <div className="space-y-3 p-5">
            <p className="text-sm font-semibold">Acesso institucional</p>
<Button asChild className="w-full">
              <Link to={session ? "/painel" : "/auth"}>
                <LogIn className="size-4" />
                {session ? "Acessar diário de bordo" : "Entrar"}
              </Link>
            </Button>
            <Link
              to="/faq"
              className="block text-center text-xs text-muted-foreground underline-offset-4 hover:underline"
            >
              O que este sistema registra?
            </Link>
          </div>
        </div>

        <p className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
          <Lock className="size-3.5" /> Acesso restrito e registrado em trilha de auditoria.
        </p>
      </section>

      <footer className="border-t border-border py-6">
        <div className="mx-auto max-w-5xl space-y-1 px-6 text-xs text-muted-foreground">
          <p>
            SNOC · DTI-AGU. Dados pessoais de terceiros tratados conforme a LGPD, com
            consentimento registrado no check-in.
          </p>
          <p className="opacity-60">Desenvolvido por Hyago Keller.</p>
        </div>
      </footer>
    </main>
  );
}

