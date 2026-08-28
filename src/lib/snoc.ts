export type Criticidade = "baixa" | "media" | "alta" | "critica";
export type ItemStatus = "C" | "NC" | "NA";
export type AppRole = "operador" | "gestor" | "super_admin";

export const TURNOS = ["Manhã (07h-13h)", "Tarde (13h-19h)", "Noite (19h-07h)"] as const;

export const CRITICIDADE_LABEL: Record<Criticidade, string> = {
  baixa: "Baixa",
  media: "Média",
  alta: "Alta",
  critica: "Crítica",
};

export const ROLE_LABEL: Record<AppRole, string> = {
  operador: "Operador SNOC",
  gestor: "Gestor AGU",
  super_admin: "Super Admin",
};

export const STATUS_LABEL: Record<ItemStatus, string> = {
  C: "Conforme",
  NC: "Não conforme",
  NA: "Não aplicável",
};

export const ATIVIDADE_TIPO_LABEL: Record<string, string> = {
  preventiva: "Manutenção preventiva",
  corretiva: "Manutenção corretiva",
  troca_peca: "Troca de peça",
  instalacao: "Instalação",
};

export const ATIVIDADE_STATUS_LABEL: Record<string, string> = {
  aberta: "Aberta",
  agendada: "Agendada",
  em_execucao: "Em execução",
  aguardando_fechamento: "Aguardando fechamento",
  fechada: "Fechada",
  cancelada: "Cancelada",
};

/** Formulário oficial de Rondas Operacionais do SNOC, migrado 1:1. */
export const CHECKLIST: { secao: string; itens: string[] }[] = [
  {
    secao: "Data Center",
    itens: [
      "Iluminação da sala em condições normais",
      "Ausência de ruídos ou odores anormais",
      "Piso elevado e vãos sem obstrução",
      "Ausência de infiltração ou vazamento",
    ],
  },
  {
    secao: "UPS / Baterias",
    itens: [
      "UPS operando em modo normal (sem bypass)",
      "Ausência de alarmes no painel",
      "Banco de baterias sem inchaço ou vazamento",
      "Temperatura da sala de baterias adequada",
    ],
  },
  {
    secao: "Climatização",
    itens: [
      "Máquinas de climatização em operação",
      "Ausência de alarme nos controladores",
      "Dreno e bandeja sem acúmulo de água",
      "Filtros sem obstrução aparente",
    ],
  },
  {
    secao: "Racks / Cabeamento",
    itens: [
      "Racks fechados e organizados",
      "Ausência de LEDs de falha em equipamentos",
      "Cabeamento identificado e sem tração",
      "Portas de rack sem obstrução de fluxo de ar",
    ],
  },
  {
    secao: "Controle de Acesso / CFTV",
    itens: [
      "Leitores de acesso operantes",
      "Câmeras com imagem e gravação ativas",
      "Portas de acesso fechadas e travadas",
      "Registro de acessos do turno conferido",
    ],
  },
  {
    secao: "Ferramentas Operacionais",
    itens: [
      "Ferramentas de monitoramento acessíveis",
      "Alertas pendentes tratados ou registrados",
      "Links e enlaces sem degradação",
      "Backups do turno sem falha reportada",
    ],
  },
];

export function criticidadeToken(c: Criticidade | null | undefined) {
  switch (c) {
    case "critica":
      return { bg: "bg-critico", fg: "text-critico-foreground", text: "text-critico" };
    case "alta":
      return { bg: "bg-alto", fg: "text-alto-foreground", text: "text-alto" };
    case "media":
      return { bg: "bg-atencao", fg: "text-atencao-foreground", text: "text-atencao" };
    default:
      return { bg: "bg-ok", fg: "text-ok-foreground", text: "text-ok" };
  }
}

export function turnoAtual(): string {
  const h = new Date().getHours();
  if (h >= 7 && h < 13) return TURNOS[0];
  if (h >= 13 && h < 19) return TURNOS[1];
  return TURNOS[2];
}

export function proximoTurno(turno: string): string {
  const i = (TURNOS as readonly string[]).indexOf(turno);
  if (i < 0) return TURNOS[0];
  return TURNOS[(i + 1) % TURNOS.length]!;
}

export function fmtDateTime(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

export function fmtDate(value?: string | null) {
  if (!value) return "—";
  return new Date(value + "T12:00:00").toLocaleDateString("pt-BR");
}

export function minutosEntre(a: string, b?: string | null) {
  const end = b ? new Date(b).getTime() : Date.now();
  return Math.round((end - new Date(a).getTime()) / 60000);
}

export function periodoRefAnterior(): string {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
