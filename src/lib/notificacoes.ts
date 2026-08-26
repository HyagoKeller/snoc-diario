import { supabase } from "@/integrations/supabase/client";

type Ref = { tipo: string; id?: string | null };

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
) {
  const { data: regras } = await supabase
    .from("regras_escalonamento")
    .select("*")
    .eq("evento", evento)
    .eq("ativa", true)
    .order("nivel");

  const destinos = new Set<string>(destinatariosExtra);
  for (const r of regras ?? []) {
    for (const d of (r.destinatarios ?? "").split(/[,;]/)) {
      const email = d.trim();
      if (email) destinos.add(email);
    }
  }
  if (destinos.size === 0) return 0;

  const rows = [...destinos].map((destinatario) => ({
    regra: evento,
    destinatario,
    canal: "email",
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
