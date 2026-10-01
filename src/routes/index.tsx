import { createFileRoute, Link } from "@tanstack/react-router";
import { LogIn, Lock, HelpCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import aguServicosLogo from "@/assets/aguservicos.png.asset.json";

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
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { session, canAccess, loading, signOut } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [showContingency, setShowContingency] = useState(false);

  async function signInMicrosoft() {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("microsoft", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error(result.error.message);
      setBusy(false);
    }
  }

  async function signInAdmin(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) toast.error("E-mail ou senha inválidos.");
  }

  return (
    <main className="flex min-h-screen flex-col">
      <div className="faixa-gov" />

<header className="border-b border-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-3">
          <p className="label-mono truncate">Advocacia-Geral da União · SGG · DTI-CSI</p>
          <Link
            to="/faq"
            className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <HelpCircle className="size-4" /> Dúvidas / FAQ
          </Link>
        </div>
      </header>

      <section className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center px-6 py-14 text-center">
<img
          src={aguServicosLogo.url}
          alt="AGU Serviços"
          className="h-20 w-auto sm:h-24"
        />

        <p className="label-mono mt-6">Secretaria de Governança e Gestão Estratégica</p>
        <p className="label-mono">DTI — Coordenação de Segurança da Informação</p>

        <h1 className="mt-4 text-4xl font-bold text-primary sm:text-5xl">SNOC</h1>
        <p className="mt-4 max-w-xl text-sm text-muted-foreground sm:text-base">
          Diário de bordo operacional: rondas, passagem de turno, gestão de acesso de terceiros e
          ordens de serviço.
        </p>

        <div className="panel mt-10 w-full max-w-sm overflow-hidden text-left">
          <div className="faixa-gov" />
          <div className="space-y-4 p-5">
            <p className="text-center text-sm font-semibold">Acesso institucional</p>
            {session && !loading ? (
              canAccess ? (
                <Button asChild className="w-full">
                  <Link to="/painel">
                    <LogIn className="size-4" />
                    Acessar diário de bordo
                  </Link>
                </Button>
              ) : (
                <div className="space-y-3 text-center">
                  <p className="text-sm text-muted-foreground">
                    Seu primeiro acesso foi registrado. Aguarde um Gestor ou Super Admin atribuir
                    seu papel e liberar o perfil.
                  </p>
                  <Button variant="outline" className="w-full" onClick={() => void signOut()}>
                    Sair desta conta
                  </Button>
                </div>
              )
            ) : (
              <>
                <Button className="w-full" size="lg" onClick={signInMicrosoft} disabled={busy}>
                  <LogIn className="size-4" />
                  Entrar com Microsoft 365
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  No primeiro acesso, seu perfil ficará pendente de aprovação.
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mx-auto flex"
                  onClick={() => setShowContingency((value) => !value)}
                >
                  Acesso de contingência
                </Button>
                {showContingency ? (
                  <form className="space-y-3 border-t border-border pt-4" onSubmit={signInAdmin}>
                    <div className="space-y-1.5">
                      <Label htmlFor="admin-email">E-mail do Super Admin</Label>
                      <Input
                        id="admin-email"
                        type="email"
                        autoComplete="username"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="admin-password">Senha</Label>
                      <Input
                        id="admin-password"
                        type="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        required
                      />
                    </div>
                    <Button type="submit" variant="outline" className="w-full" disabled={busy}>
                      Entrar como Super Admin
                    </Button>
                  </form>
                ) : null}
              </>
            )}
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

