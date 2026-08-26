import { createFileRoute, Link } from "@tanstack/react-router";
import { Activity, ClipboardCheck, Repeat2, ShieldCheck, Wrench, LogIn } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SNOC OPS | Rondas, Turnos, Acesso e OS do Data Center" },
      {
        name: "description",
        content:
          "SNOC OPS unifica rondas operacionais com evidência fotográfica, passagem de turno com escalonamento, controle de acesso de terceiros e ordens de serviço.",
      },
      { property: "og:title", content: "SNOC OPS — operação unificada do Data Center" },
      {
        property: "og:description",
        content:
          "Rondas digitais, passagem de turno com prazo, acesso de terceiros e OS com evidência antes/depois.",
      },
    ],
  }),
  component: Landing,
});

const MODULOS = [
  {
    icon: ClipboardCheck,
    titulo: "Rondas operacionais",
    texto:
      "Checklist digital por seção com C/NC/NA, foto obrigatória em não conformidade e resumo calculado pelo sistema.",
  },
  {
    icon: Repeat2,
    titulo: "Passagem de turno",
    texto:
      "Aceite com prazo. Sem confirmação no tempo definido, o escalonamento sai automaticamente para a chefia configurada.",
  },
  {
    icon: ShieldCheck,
    titulo: "Acesso de terceiros",
    texto:
      "Check-in amarrado a uma OS, foto de documento, acompanhante interno e alerta de check-out em atraso.",
  },
  {
    icon: Wrench,
    titulo: "Atividades e OS",
    texto:
      "Abertura, aviso ao fornecedor, evidência antes/depois, laudo anexado e fechamento rastreável.",
  },
];

function Landing() {
  const { session } = useAuth();

  return (
    <main className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-md bg-primary/15 text-primary">
            <Activity className="size-5" />
          </div>
          <div>
            <p className="font-display text-lg leading-none font-bold">SNOC OPS</p>
            <p className="label-mono">DTI-AGU · Network Operations Center</p>
          </div>
        </div>
        <Button asChild>
          <Link to={session ? "/painel" : "/auth"}>
            <LogIn className="size-4" />
            {session ? "Abrir painel" : "Entrar"}
          </Link>
        </Button>
      </header>

      <section className="mx-auto max-w-6xl px-6 pt-10 pb-16">
        <p className="label-mono">Plataforma operacional unificada</p>
        <h1 className="mt-3 max-w-3xl text-4xl leading-tight font-bold sm:text-5xl">
          Uma única plataforma para <span className="text-primary">rondas</span>, passagem de turno,
          acesso de terceiros e ordens de serviço.
        </h1>
        <p className="mt-5 max-w-2xl text-base text-muted-foreground">
          Os formulários em papel e PDF do SNOC passam a ser registro digital com evidência
          fotográfica, prazo de aceite, escalonamento automático e histórico auditável do Data
          Center.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link to={session ? "/painel" : "/auth"}>
              {session ? "Ir para o painel" : "Acessar o sistema"}
            </Link>
          </Button>
        </div>

        <div className="mt-16 grid gap-4 sm:grid-cols-2">
          {MODULOS.map((m) => (
            <article key={m.titulo} className="panel p-6">
              <m.icon className="size-5 text-primary" />
              <h2 className="mt-4 text-lg font-semibold">{m.titulo}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{m.texto}</p>
            </article>
          ))}
        </div>

        <div className="panel mt-4 p-6">
          <h2 className="text-lg font-semibold">Cada papel, uma visão do mesmo dado</h2>
          <div className="mt-4 grid gap-6 sm:grid-cols-3">
            <div>
              <p className="label-mono">Operador SNOC</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Fila do turno: rondas pendentes, aceite de passagem, terceiros em campo e suas OS.
              </p>
            </div>
            <div>
              <p className="label-mono">Gestor AGU</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Indicadores consolidados: NC por criticidade, SLA de aceite, tendência de
                temperatura e relatórios mensais.
              </p>
            </div>
            <div>
              <p className="label-mono">Super Admin</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Papéis, regras de escalonamento, destinatários de relatório e log de auditoria.
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-6">
        <p className="mx-auto max-w-6xl px-6 text-xs text-muted-foreground">
          SNOC OPS · DTI-AGU. Dados pessoais de terceiros tratados conforme a LGPD, com
          consentimento registrado no check-in.
        </p>
      </footer>
    </main>
  );
}
