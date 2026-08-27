import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ClipboardCheck, Repeat2, ShieldCheck, Wrench, FileText } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "Perguntas frequentes | SNOC OPS" },
      {
        name: "description",
        content:
          "O que o SNOC OPS registra: rondas com evidência fotográfica, passagem de turno com prazo de aceite, acesso de terceiros e ordens de serviço, papéis de acesso e tratamento de dados.",
      },
      { property: "og:title", content: "Perguntas frequentes do SNOC OPS" },
      {
        property: "og:description",
        content: "Módulos, papéis de acesso, prazos de escalonamento e tratamento de dados pessoais.",
      },
    ],
  }),
  component: Faq,
});

const MODULOS = [
  {
    icon: ClipboardCheck,
    titulo: "Rondas operacionais",
    texto:
      "Checklist digital por seção com C/NC/NA. Toda não conformidade exige foto e criticidade, e o resumo do turno é calculado pelo sistema.",
  },
  {
    icon: Repeat2,
    titulo: "Passagem de turno",
    texto:
      "O operador que entrega registra status de sistemas, incidentes e pendências. O aceite tem prazo; sem confirmação, o escalonamento é enviado à chefia configurada.",
  },
  {
    icon: ShieldCheck,
    titulo: "Acesso de terceiros",
    texto:
      "Check-in amarrado a uma OS, foto de documento, acompanhante interno, consentimento LGPD e check-out obrigatório, com alerta quando passa da duração prevista.",
  },
  {
    icon: Wrench,
    titulo: "Atividades e OS",
    texto:
      "Abertura da ordem, aviso ao fornecedor, evidência antes/depois, laudo anexado e fechamento rastreável.",
  },
  {
    icon: FileText,
    titulo: "Relatórios e auditoria",
    texto:
      "Consolidação mensal de rondas, NC por criticidade, SLA de aceite e acessos de terceiros, com log permanente de quem fez o quê.",
  },
];

const PERGUNTAS = [
  {
    q: "Quem pode acessar o sistema?",
    a: "Operador SNOC vê a fila do turno: rondas pendentes, aceite de passagem, terceiros em campo e suas OS. Gestor AGU vê indicadores consolidados e relatórios. Super Admin administra papéis, regras de escalonamento e destinatários. Novos cadastros entram como Operador até a chefia ajustar o papel.",
  },
  {
    q: "Por que a foto é obrigatória em não conformidade?",
    a: "A evidência fotográfica substitui o formulário em papel e sustenta o registro em auditoria. Sem a foto, o item não conforme não pode ser finalizado na ronda.",
  },
  {
    q: "O que acontece se ninguém aceitar a passagem de turno?",
    a: "A passagem fica com aceite pendente e prazo. Ao expirar, o sistema dispara o escalonamento para os destinatários definidos na regra correspondente e registra a notificação.",
  },
  {
    q: "Como funciona o check-out de terceiros?",
    a: "Toda visita em campo precisa de check-out, que grava o horário de saída, registra na trilha de auditoria e move a OS vinculada para aguardando fechamento. Passando da duração prevista, a visita é marcada como check-out em atraso e permite notificar os responsáveis.",
  },
  {
    q: "Como os dados pessoais de terceiros são tratados?",
    a: "Nome, documento e imagem são tratados para controle de acesso a infraestrutura crítica, com consentimento registrado no check-in e retenção de 5 anos, conforme a LGPD (art. 7º). As imagens ficam em armazenamento privado, acessível apenas por link assinado a usuários autenticados.",
  },
  {
    q: "Esqueci a senha ou preciso de suporte. Onde recorro?",
    a: "Abra chamado no AGU Serviços para a DTI, indicando SNOC OPS e o e-mail institucional utilizado no acesso.",
  },
];

function Faq() {
  return (
    <main className="flex min-h-screen flex-col">
      <div className="faixa-gov" />

      <header className="border-b border-border">
        <div className="mx-auto grid max-w-3xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-6 py-4">
          <p className="label-mono truncate">Advocacia-Geral da União · DTI · SNOC</p>
          <Link
            to="/"
            className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" /> Voltar
          </Link>
        </div>
      </header>

      <section className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
        <p className="label-mono">Ajuda</p>
        <h1 className="mt-2 text-3xl font-bold">Perguntas frequentes</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Os formulários em papel e PDF do SNOC passaram a ser registro digital com evidência,
          prazo de aceite, escalonamento automático e histórico auditável. Para o passo a passo de
          cada tela, consulte o{" "}
          <Link to="/manual" className="text-primary hover:underline">
            manual de utilização
          </Link>
          .
        </p>


        <h2 className="mt-10 text-lg font-semibold">O que o sistema registra</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {MODULOS.map((m) => (
            <article key={m.titulo} className="panel p-5">
              <m.icon className="size-5 text-primary" />
              <h3 className="mt-3 text-base font-semibold">{m.titulo}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{m.texto}</p>
            </article>
          ))}
        </div>

        <h2 className="mt-10 text-lg font-semibold">Dúvidas comuns</h2>
        <Accordion type="single" collapsible className="panel mt-4 px-5">
          {PERGUNTAS.map((p) => (
            <AccordionItem key={p.q} value={p.q}>
              <AccordionTrigger className="text-left text-sm">{p.q}</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">{p.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      <footer className="border-t border-border py-6">
        <p className="mx-auto max-w-3xl px-6 text-xs text-muted-foreground">
          SNOC OPS · DTI-AGU. Suporte pelo AGU Serviços.
        </p>
      </footer>
    </main>
  );
}
