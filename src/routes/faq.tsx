import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ClipboardCheck, Repeat2, ShieldCheck, Wrench, FileText } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "Perguntas frequentes | SNOC" },
      {
        name: "description",
        content:
          "O que o SNOC registra: rondas com foto ou vídeo, passagem de turno, acesso de terceiros e ordens de serviço.",
      },
      { property: "og:title", content: "Perguntas frequentes do SNOC" },
      {
        property: "og:description",
        content: "Módulos, papéis de acesso, prazos de escalonamento e tratamento de dados pessoais.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Faq,
});

const MODULOS = [
  {
    icon: ClipboardCheck,
    titulo: "Rondas operacionais",
    texto:
      "Checklist digital por seção com C/NC/NA. Toda não conformidade exige foto ou vídeo e criticidade, e o resumo do turno é calculado pelo sistema.",
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
      "Check-in individual ou em grupo, amarrado a uma OS. No grupo, somente os dados do líder da excursão são preenchidos.",
  },
  {
    icon: Wrench,
    titulo: "Atividades e OS",
    texto:
      "Abertura da ordem com patrimônio ou serial, aviso ao fornecedor, evidência antes/depois e fechamento rastreável.",
  },
  {
    icon: FileText,
    titulo: "Relatórios e auditoria",
    texto:
      "Consolidação mensal de rondas, NC por criticidade, SLA de aceite e acessos de terceiros, com log permanente de quem fez o quê.",
  },
];

const NUMEROS = [
  { valor: "6 seções", texto: "Checklist oficial de ronda" },
  { valor: "15 min", texto: "Prazo de aceite do turno" },
  { valor: "5 anos", texto: "Retenção de evidências" },
];

const PERGUNTAS = [
  {
    q: "Quem pode acessar o sistema?",
    a: "O primeiro acesso é feito com a conta institucional Microsoft 365 e cria um cadastro pendente. Um Gestor ou Super Admin atribui o papel antes da liberação. Operador SNOC vê a fila do turno; Gestor AGU também vê relatórios e aprova usuários; Super Admin mantém a administração completa.",
  },
  {
    q: "Quando a sessão é encerrada?",
    a: "Além da saída manual, o sistema encerra automaticamente a sessão nas mudanças de turno: 00h, 06h, 12h e 18h. O próximo técnico deve entrar com o próprio perfil.",
  },

  {
    q: "Por que a evidência é obrigatória em não conformidade?",
    a: "A foto ou o vídeo sustenta o registro em auditoria. No celular, os botões abrem a câmera diretamente. Sem evidência, o item não conforme não pode ser finalizado.",
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
    a: "Abra chamado no AGU Serviços para a DTI, indicando SNOC e o e-mail institucional utilizado no acesso.",
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

        <dl className="mt-8 grid gap-3 sm:grid-cols-3">
          {NUMEROS.map((n) => (
            <div key={n.valor} className="panel px-4 py-4">
              <dt className="font-display text-base font-bold">{n.valor}</dt>
              <dd className="mt-1 text-xs text-muted-foreground">{n.texto}</dd>
            </div>
          ))}
        </dl>


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
          SNOC · DTI-AGU. Suporte pelo AGU Serviços.
        </p>
      </footer>
    </main>
  );
}
