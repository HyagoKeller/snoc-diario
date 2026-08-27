import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  ClipboardCheck,
  FileText,
  LayoutDashboard,
  LogIn,
  Printer,
  Repeat2,
  Settings,
  ShieldCheck,
  Users,
  Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/manual")({
  head: () => ({
    meta: [
      { title: "Manual de utilização | SNOC OPS" },
      {
        name: "description",
        content:
          "Manual completo do SNOC OPS: acesso e papéis, rondas com evidência, passagem de turno, acesso de terceiros, ordens de serviço, relatórios, administração e boas práticas.",
      },
      { property: "og:title", content: "Manual de utilização do SNOC OPS" },
      {
        property: "og:description",
        content:
          "Passo a passo de cada módulo: rondas, passagem de turno, terceiros, OS, relatórios e administração.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Manual,
});

type Secao = {
  id: string;
  titulo: string;
  icon: React.ElementType;
  resumo: string;
  passos?: { titulo: string; texto: string }[];
  regras?: string[];
};

const SECOES: Secao[] = [
  {
    id: "acesso",
    titulo: "1. Acesso e papéis",
    icon: LogIn,
    resumo:
      "O SNOC OPS é de uso restrito à operação do Data Center da AGU. O acesso é feito com e-mail institucional e senha, e todo login e ação relevante fica registrado em auditoria.",
    passos: [
      {
        titulo: "Criar conta",
        texto:
          "Na tela de acesso, use a aba de cadastro, informe nome completo, e-mail institucional e senha. Todo novo usuário entra com o papel Operador.",
      },
      {
        titulo: "Entrar",
        texto:
          "Informe e-mail e senha. Após autenticar, o sistema abre o Painel operacional com a fila do seu turno.",
      },
      {
        titulo: "Sair",
        texto:
          "Use o botão Sair na barra lateral (ou no topo, no celular). A sessão é encerrada e os dados em cache são limpos.",
      },
    ],
    regras: [
      "Operador SNOC: registra rondas, passagens de turno, acessos de terceiros e ordens de serviço; vê a própria fila.",
      "Gestor AGU: enxerga tudo do operador mais indicadores consolidados e o módulo de Relatórios.",
      "Super Admin: além do acima, administra papéis, regras de escalonamento, notificações e auditoria.",
      "A mudança de papel é feita apenas pelo Super Admin, em Administração → Usuários.",
    ],
  },
  {
    id: "painel",
    titulo: "2. Painel operacional",
    icon: LayoutDashboard,
    resumo:
      "É a tela inicial após o login. Mostra o estado do turno atual e o que exige ação imediata.",
    regras: [
      "Ronda do turno atual: indica se a ronda do turno já foi iniciada, concluída ou está pendente, com o total de não conformidades.",
      "Aceites pendentes: passagens de turno aguardando confirmação, com o percentual de aceites dentro do prazo (SLA).",
      "Terceiros em campo: visitas sem check-out e quantas passaram da duração prevista.",
      "OS em aberto: ordens de serviço não fechadas; o operador vê as próprias, o gestor vê todas.",
      "Gráficos: não conformidades por criticidade e tendência de temperatura/umidade dos últimos 30 dias.",
      "Alerta vermelho de check-out em atraso: leve o caso ao módulo Terceiros e regularize a saída.",
    ],
  },
  {
    id: "rondas",
    titulo: "3. Rondas operacionais",
    icon: ClipboardCheck,
    resumo:
      "Substitui o checklist em papel. Cada ronda é vinculada a data, turno, localidade e responsável, e percorre as seções oficiais de verificação.",
    passos: [
      {
        titulo: "Abrir nova ronda",
        texto:
          "Rondas → Nova ronda. Confirme data, turno e localidade e informe temperatura e umidade lidas no ambiente.",
      },
      {
        titulo: "Percorrer o checklist",
        texto:
          "Para cada item, marque C (conforme), NC (não conforme) ou NA (não aplicável). Itens NA devem ter justificativa na observação.",
      },
      {
        titulo: "Registrar não conformidade",
        texto:
          "Ao marcar NC, informe a criticidade (baixa, média, alta ou crítica), descreva o problema e anexe a foto — a evidência é obrigatória.",
      },
      {
        titulo: "Finalizar",
        texto:
          "Ao finalizar, o sistema calcula o total de NC e o resultado geral do turno. A ronda finalizada fica disponível em Rondas → detalhe, com todas as evidências.",
      },
    ],
    regras: [
      "Sem foto, o item NC não permite finalizar a ronda.",
      "Criticidade alta ou crítica deve gerar uma OS no módulo Atividades.",
      "Somente o responsável pela ronda ou um gestor pode alterá-la.",
    ],
  },
  {
    id: "passagens",
    titulo: "4. Passagem de turno",
    icon: Repeat2,
    resumo:
      "Formaliza a troca entre operadores, com registro do que fica pendente e prazo de aceite pelo operador que assume.",
    passos: [
      {
        titulo: "Registrar a entrega",
        texto:
          "Passagem de turno → nova passagem. Informe data, turno, status dos sistemas, incidentes ativos e mudanças realizadas.",
      },
      {
        titulo: "Listar pendências",
        texto:
          "Adicione cada pendência com descrição, responsável, prazo e risco. Elas seguem visíveis até serem marcadas como resolvidas.",
      },
      {
        titulo: "Indicar quem recebe",
        texto: "Selecione o operador que assume. Ele passa a ver a passagem como aceite pendente.",
      },
      {
        titulo: "Aceitar",
        texto:
          "O operador que assume revisa o conteúdo e confirma o aceite. O horário do aceite é gravado e comparado ao prazo.",
      },
    ],
    regras: [
      "O prazo padrão de aceite é de 15 minutos após o registro (ajustável em Administração).",
      "Prazo vencido sem aceite: o sistema escalona para os destinatários da regra e registra a notificação.",
      "Passagem aceita não deve ser editada; corrija com um novo registro e observação.",
    ],
  },
  {
    id: "terceiros",
    titulo: "5. Acesso de terceiros",
    icon: ShieldCheck,
    resumo:
      "Controla entrada e saída de prestadores nas zonas do Data Center, sempre vinculado a uma atividade autorizada.",
    passos: [
      {
        titulo: "Cadastrar fornecedor",
        texto:
          "Terceiros → Fornecedores. Informe razão social, contato, documento, validade da credencial e tarefas autorizadas.",
      },
      {
        titulo: "Check-in",
        texto:
          "Informe a pessoa, o documento (com foto), a zona de acesso, a OS vinculada, o acompanhante interno e a duração prevista. Registre o consentimento LGPD.",
      },
      {
        titulo: "Acompanhamento",
        texto:
          "A visita aparece como “em campo” no Painel. Passando a duração prevista, entra no alerta de check-out em atraso.",
      },
      {
        titulo: "Check-out",
        texto:
          "Ao término, use Check-out na visita. O horário de saída é gravado, a auditoria registra o evento e a OS vinculada vai para “aguardando fechamento”.",
      },
    ],
    regras: [
      "Nenhum acesso deve ocorrer sem OS e sem acompanhante interno.",
      "Credencial vencida do fornecedor bloqueia a liberação — atualize o cadastro antes.",
      "Toda visita precisa de check-out; visitas abertas do turno anterior devem ser tratadas na passagem de turno.",
    ],
  },
  {
    id: "atividades",
    titulo: "6. Atividades e ordens de serviço",
    icon: Wrench,
    resumo:
      "Ciclo de vida da OS: abertura, acionamento do fornecedor, execução com evidências e fechamento rastreável.",
    passos: [
      {
        titulo: "Abrir OS",
        texto:
          "Atividades → nova. Escolha o tipo (preventiva, corretiva, troca de peça, instalação), descreva o problema, informe o ativo afetado, a criticidade, o fornecedor e a janela prevista.",
      },
      {
        titulo: "Acionar fornecedor",
        texto:
          "Com fornecedor e e-mail cadastrados, o sistema envia o acionamento e grava a data do envio na OS.",
      },
      {
        titulo: "Executar",
        texto:
          "Atualize o status conforme o andamento: agendada, em execução, aguardando fechamento. O check-in do terceiro se conecta à OS.",
      },
      {
        titulo: "Anexar evidências",
        texto:
          "Envie a foto “antes”, a foto “depois” e, quando houver, o laudo técnico do fornecedor.",
      },
      {
        titulo: "Fechar",
        texto:
          "O fechamento só é liberado com evidência antes e depois. O horário e o autor do fechamento ficam registrados.",
      },
    ],
    regras: [
      "OS crítica deve ser comunicada à chefia no mesmo turno.",
      "Cancelamento exige justificativa na descrição e fica registrado em auditoria.",
      "Cada OS recebe um código sequencial usado nas comunicações com o fornecedor.",
    ],
  },
  {
    id: "relatorios",
    titulo: "7. Relatórios (gestor)",
    icon: FileText,
    resumo:
      "Consolidação mensal dos indicadores da operação, usada para prestação de contas e reuniões de acompanhamento.",
    regras: [
      "Selecione o mês de referência e gere a consolidação.",
      "Rondas: total realizado, aderência ao checklist e NC por criticidade.",
      "Passagem de turno: volume, aceites no prazo e percentual de SLA.",
      "Terceiros: número de acessos, tempo médio em campo e check-outs em atraso.",
      "Atividades: abertas, fechadas, tempo médio de atendimento e distribuição por fornecedor.",
      "O relatório gerado fica salvo com o período de referência para consulta posterior.",
    ],
  },
  {
    id: "administracao",
    titulo: "8. Administração (super admin)",
    icon: Settings,
    resumo:
      "Configuração do sistema e trilha de conformidade. Alterações aqui afetam toda a operação.",
    regras: [
      "Usuários e papéis: conceder ou remover Operador, Gestor e Super Admin.",
      "Regras de escalonamento: por evento, definir prazo em minutos, nível e destinatários.",
      "Notificações: histórico de disparos com destinatário, assunto e horário.",
      "Auditoria: log permanente de ações — quem fez, o que fez, em qual registro e quando. Não é editável.",
    ],
  },
  {
    id: "boas-praticas",
    titulo: "9. Boas práticas e rotina do turno",
    icon: Users,
    resumo: "Sequência recomendada para manter a operação em conformidade.",
    regras: [
      "Início do turno: aceitar a passagem, ler as pendências e conferir terceiros em campo.",
      "Durante o turno: executar a ronda completa, abrir OS para toda NC alta ou crítica e manter os check-ins atualizados.",
      "Fim do turno: encerrar visitas abertas, finalizar a ronda e registrar a passagem com pendências e responsáveis.",
      "Registre no momento do fato: lançamentos atrasados comprometem a evidência e o SLA.",
      "Nunca compartilhe credenciais: cada ação é atribuída ao usuário autenticado.",
    ],
  },
];

function Manual() {
  return (
    <div className="min-h-screen bg-background">
      <div className="faixa-gov" />
      <header className="border-b border-border bg-topbar text-topbar-foreground">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-4">
          <Link to="/" className="inline-flex items-center gap-2 text-sm hover:underline">
            <ArrowLeft className="size-4" /> Voltar
          </Link>
          <span className="text-xs opacity-80">DTI-AGU · SNOC OPS</span>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-10">
        <p className="label-mono">Documentação oficial</p>
        <h1 className="mt-2 text-3xl font-bold">Manual de utilização do SNOC OPS</h1>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
          Guia completo da plataforma unificada de rondas, passagem de turno, controle de acesso de
          terceiros e gestão de atividades do Data Center da AGU. Cada seção descreve o passo a passo
          da tela e as regras que o sistema aplica.
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => window.print()}>
            <Printer className="size-4" /> Imprimir / salvar PDF
          </Button>
          <Button asChild size="sm" variant="ghost">
            <Link to="/faq">Perguntas frequentes</Link>
          </Button>
        </div>

        <nav className="panel mt-8 p-5">
          <h2 className="text-base font-semibold">Sumário</h2>
          <ol className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            {SECOES.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="text-muted-foreground hover:text-primary">
                  {s.titulo}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="mt-8 space-y-6">
          {SECOES.map((s) => (
            <section key={s.id} id={s.id} className="panel scroll-mt-6 p-6">
              <div className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-md bg-primary/15 text-primary">
                  <s.icon className="size-4" />
                </span>
                <h2 className="text-lg font-semibold">{s.titulo}</h2>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{s.resumo}</p>

              {s.passos ? (
                <ol className="mt-5 space-y-4">
                  {s.passos.map((p, i) => (
                    <li key={p.titulo} className="flex gap-3">
                      <span className="font-mono flex size-6 shrink-0 items-center justify-center rounded-full bg-secondary text-xs text-secondary-foreground">
                        {i + 1}
                      </span>
                      <div>
                        <p className="text-sm font-medium">{p.titulo}</p>
                        <p className="mt-0.5 text-sm text-muted-foreground">{p.texto}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              ) : null}

              {s.regras ? (
                <ul className="mt-5 space-y-2 border-t border-border pt-4 text-sm text-muted-foreground">
                  {s.regras.map((r) => (
                    <li key={r} className="flex gap-2">
                      <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>
          ))}
        </div>

        <section className="panel mt-6 p-6">
          <h2 className="text-lg font-semibold">Suporte</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Dúvidas de uso, correção de registro ou ajuste de papel devem ser encaminhadas à chefia
            do SNOC e à DTI-AGU. Registros de auditoria não são apagados: correções são feitas por
            novo lançamento com justificativa.
          </p>
        </section>
      </main>
    </div>
  );
}
