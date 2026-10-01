import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Entrar | SNOC" },
      { name: "description", content: "Acesso dos operadores e gestores do SNOC ao sistema." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (session) navigate({ to: "/painel", replace: true });
  }, [session, navigate]);

  async function entrarComMicrosoft() {
    setBusy(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "azure",
      options: {
        scopes: "openid profile email",
        redirectTo: window.location.origin + "/auth",
      },
    });
    if (error) {
      toast.error(error.message);
      setBusy(false);
    }
  }

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Acesso liberado");
    navigate({ to: "/painel", replace: true });
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center justify-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-md bg-primary/15 text-primary">
            <Activity className="size-5" />
          </div>
          <div>
            <p className="font-display text-lg leading-none font-bold">SNOC</p>
            <p className="label-mono">DTI-AGU</p>
          </div>
        </div>

        <div className="panel space-y-6 p-6">
          <div className="space-y-2 text-center">
            <h1 className="text-xl font-bold">Acesso ao Sistema</h1>
            <p className="text-sm text-muted-foreground">Utilize sua conta institucional da AGU</p>
          </div>

          <Button 
            className="w-full" 
            size="lg" 
            onClick={entrarComMicrosoft} 
            disabled={busy}
          >
            <img 
              src="https://www.microsoft.com/favicon.ico" 
              alt="" 
              className="mr-2 size-4" 
            />
            Entrar com Microsoft 365
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Ou fallback admin</span>
            </div>
          </div>

          <form onSubmit={entrar} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nome@agu.gov.br"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="senha">Senha</Label>
              <Input
                id="senha"
                type="password"
                required
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
              />
            </div>
            <Button type="submit" variant="outline" className="w-full" disabled={busy}>
              {busy ? "Verificando…" : "Entrar com e-mail/senha"}
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground">
            Novos acessos via Microsoft 365 ficam pendentes de ativação por um gestor.
          </p>
        </div>
      </div>
    </main>
  );
}
