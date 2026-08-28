import { supabase } from "@/integrations/supabase/client";
import type { Criticidade } from "@/lib/snoc";

type Ref = { tipo: string; id?: string | null };

const ORDEM_CRIT: Criticidade[] = ["baixa", "media", "alta", "critica"];

export type DisparoOpts = {
  /** Criticidade do fato ocorrido — regras com criticidade mínima maior são ignoradas. */
  criticidade?: Criticidade | null;
  /** Turno relacionado, usado para resolver coordenadores e técnicos da escala. */
  turno?: string | null;
};

/** E-mails dos coordenadores cadastrados para o turno. */
export async function coordenadoresDoTurno(turno: string): Promise<string[]> {
  const { data } = await supabase
    .from("turnos_equipe")
    .select("coordenadores")
    .eq("turno", turno)
    .maybeSingle();
  return splitEmails(data?.coordenadores ?? "");
}

/** Técnicos ativos escalados para o turno, na ordem de recebimento da passagem. */
export async function tecnicosDoTurno(turno: string) {
  const { data: t } = await supabase
    .from("turnos_equipe")
    .select("id")
    .eq("turno", turno)
    .maybeSingle();
  if (!t) return [] as { user_id: string; nome: string; email: string; papel_turno: string }[];
  const { data: membros } = await supabase
    .from("turno_membros")
    .select("user_id,papel_turno,ordem")
    .eq("turno_id", t.id)
    .eq("ativo", true)
    .order("ordem");
  const ids = (membros ?? []).map((m) => m.user_id);
  if (!ids.length) return [];
  const { data: perfis } = await supabase.from("profiles").select("id,nome,email").in("id", ids);
  return (membros ?? []).map((m) => {
    const p = (perfis ?? []).find((x) => x.id === m.user_id);
    return {
      user_id: m.user_id,
      papel_turno: m.papel_turno,
      nome: p?.nome ?? "",
      email: p?.email ?? "",
    };
  });
}

/** E-mails de gestores e super admins — usados quando a regra pede notificar a gerência. */
export async function emailsGestores(): Promise<string[]> {
  const { data: papeis } = await supabase
    .from("user_roles")
    .select("user_id,role")
    .in("role", ["gestor", "super_admin"]);
  const ids = [...new Set((papeis ?? []).map((p) => p.user_id))];
  if (!ids.length) return [];
  const { data: perfis } = await supabase.from("profiles").select("email").in("id", ids);
  return splitEmails((perfis ?? []).map((p) => p.email).join(","));
}

function splitEmails(raw: string): string[] {
  return raw
    .split(/[,;\s]+/)
    .map((x) => x.trim())
    .filter((x) => x.includes("@"));
}

/**
 * Motor de notificações: resolve os destinatários pelas regras cadastradas
 * (configuráveis pelo Super Admin) e registra cada disparo para auditoria.
 */
export async function dispararNotificacao(
  evento: string,
  assunto: string,
  corpo: string,
  ref: Ref,
  destinatariosExtra: string[] = [],
  opts: DisparoOpts = {},
) {
  const { data: regras } = await supabase
    .from("regras_escalonamento")
    .select("*")
    .eq("evento", evento)
    .eq("ativa", true)
    .order("nivel");

  const destinos = new Set<string>(splitEmails(destinatariosExtra.join(",")));
  let canal = "email";
  let precisaCoordenadores = false;
  let precisaGestores = false;

  for (const r of regras ?? []) {
    const min = r.criticidade_minima as Criticidade | null;
    if (min && opts.criticidade) {
      if (ORDEM_CRIT.indexOf(opts.criticidade) < ORDEM_CRIT.indexOf(min)) continue;
    }
    canal = r.canal || "email";
    if (r.notificar_coordenadores) precisaCoordenadores = true;
    if (r.notificar_gestores) precisaGestores = true;
    for (const email of splitEmails(r.destinatarios ?? "")) destinos.add(email);
  }

  if (precisaCoordenadores && opts.turno) {
    for (const e of await coordenadoresDoTurno(opts.turno)) destinos.add(e);
  }
  if (precisaGestores) {
    for (const e of await emailsGestores()) destinos.add(e);
  }

  if (destinos.size === 0) return 0;

  const rows = [...destinos].map((destinatario) => ({
    regra: evento,
    destinatario,
    canal,
    assunto,
    corpo,
    referencia_tipo: ref.tipo,
    referencia_id: ref.id ?? null,
  }));
  await supabase.from("notificacoes").insert(rows);
  return rows.length;
}

export async function registrarAuditoria(
  acao: string,
  entidade: string,
  entidade_id?: string | null,
  detalhes?: unknown,
) {
  const { data } = await supabase.auth.getUser();
  if (!data.user) return;
  await supabase.from("auditoria").insert({
    usuario_id: data.user.id,
    acao,
    entidade,
    entidade_id: entidade_id ?? null,
    detalhes: (detalhes ?? null) as never,
  });
}
