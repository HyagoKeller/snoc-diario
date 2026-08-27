import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type ChamadoItsm = {
  numero: string;
  titulo: string | null;
  status: string | null;
  prioridade: string | null;
  categoria: string | null;
  solicitante: string | null;
  criado_em: string | null;
  url: string | null;
  consultado_em: string;
};

export type ChamadoItsmResultado =
  | { ok: true; chamado: ChamadoItsm }
  | { ok: false; erro: string };

function primeiro(obj: Record<string, unknown>, chaves: string[]): string | null {
  for (const k of chaves) {
    const v = obj[k];
    if (typeof v === "string" && v.trim()) return v;
    if (typeof v === "number") return String(v);
    if (v && typeof v === "object") {
      const nome = (v as Record<string, unknown>)["name"] ?? (v as Record<string, unknown>)["title"];
      if (typeof nome === "string" && nome.trim()) return nome;
    }
  }
  return null;
}

export const buscarChamadoItsm = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ numero: z.string().min(1).max(32) }).parse(input))
  .handler(async ({ data, context }): Promise<ChamadoItsmResultado> => {
    const numero = data.numero.replace(/[^0-9A-Za-z-]/g, "");
    if (!numero) return { ok: false, erro: "Número de chamado inválido." };

    const token = process.env["INVGATE_API_TOKEN"];
    if (!token) {
      return {
        ok: false,
        erro:
          "Integração não configurada: falta o token de API do InvGate. Um Super Admin precisa cadastrá-lo.",
      };
    }

    const { data: cfg } = await context.supabase
      .from("integracoes_config")
      .select("valor")
      .eq("chave", "invgate_base_url")
      .maybeSingle();
    const base = (cfg?.valor ?? "").replace(/\/+$/, "");
    if (!base) return { ok: false, erro: "URL base do InvGate não configurada em Administração → Integrações." };

    const auth = token.includes(":")
      ? `Basic ${Buffer.from(token).toString("base64")}`
      : `Bearer ${token}`;

    let resposta: Response;
    try {
      resposta = await fetch(`${base}/api/v1/incident?id=${encodeURIComponent(numero)}`, {
        headers: { Authorization: auth, Accept: "application/json" },
      });
    } catch (e) {
      console.error("InvGate indisponível", e);
      return { ok: false, erro: "Não foi possível falar com o InvGate agora. Registre o número manualmente." };
    }

    if (!resposta.ok) {
      const corpo = await resposta.text();
      console.error(`InvGate ${resposta.status}: ${corpo.slice(0, 500)}`);
      if (resposta.status === 404) return { ok: false, erro: `Chamado ${numero} não encontrado no InvGate.` };
      if (resposta.status === 401 || resposta.status === 403)
        return { ok: false, erro: "Token do InvGate sem permissão para consultar chamados." };
      return { ok: false, erro: `InvGate respondeu ${resposta.status}. Tente novamente mais tarde.` };
    }

    let bruto: unknown;
    try {
      bruto = await resposta.json();
    } catch {
      return { ok: false, erro: "Resposta do InvGate em formato inesperado." };
    }

    const raiz = (bruto as Record<string, unknown>) ?? {};
    const alvo = (raiz["incident"] ?? raiz["data"] ?? raiz) as Record<string, unknown>;
    const registro = Array.isArray(alvo) ? ((alvo[0] ?? {}) as Record<string, unknown>) : alvo;

    return {
      ok: true,
      chamado: {
        numero,
        titulo: primeiro(registro, ["title", "subject", "summary", "name"]),
        status: primeiro(registro, ["status", "state", "incident.status"]),
        prioridade: primeiro(registro, ["priority", "urgency", "impact"]),
        categoria: primeiro(registro, ["category", "categoryName", "service"]),
        solicitante: primeiro(registro, ["requester", "created_by", "customer", "author"]),
        criado_em: primeiro(registro, ["created_at", "creation_date", "createdDate", "date"]),
        url: `${base}/incident/${encodeURIComponent(numero)}`,
        consultado_em: new Date().toISOString(),
      },
    };
  });
