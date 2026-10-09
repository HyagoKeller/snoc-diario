import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { invgateAuthorization, invgateBaseUrl } from "./invgate-auth.server";

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

    const auth = invgateAuthorization(
      process.env["INVGATE_API_USERNAME"],
      process.env["INVGATE_API_KEY"],
      process.env["INVGATE_API_TOKEN"],
    );
    if (!auth) {
      return {
        ok: false,
        erro:
          "Conexão pendente: cadastre o nome de usuário e a chave da credencial de API do InvGate nos segredos do projeto (INVGATE_API_USERNAME e INVGATE_API_KEY).",
      };
    }

    const { data: cfg, error: cfgError } = await context.supabase
      .from("integracoes_config")
      .select("valor")
      .eq("chave", "invgate_base_url")
      .maybeSingle();
    if (cfgError) return { ok: false, erro: "Não foi possível ler a configuração do InvGate." };
    const base = invgateBaseUrl(cfg?.valor ?? "");
    if (!base) return { ok: false, erro: "Configure uma URL HTTPS válida do InvGate em Administração → Integrações." };

    let resposta: Response;
    try {
      resposta = await fetch(`${base}/api/v1/incident?id=${encodeURIComponent(numero)}`, {
        headers: { Authorization: auth, Accept: "application/json" },
        redirect: "error",
      });
    } catch (e) {
      console.error("InvGate indisponível", e);
      return { ok: false, erro: "Não foi possível falar com o InvGate agora. Registre o número manualmente." };
    }

    if (!resposta.ok) {
      console.error(`Falha na consulta InvGate: HTTP ${resposta.status}`);
      if (resposta.status === 404) return { ok: false, erro: `Chamado ${numero} não encontrado no InvGate.` };
      if (resposta.status === 401)
        return { ok: false, erro: "InvGate respondeu 401: verifique o nome de usuário e a chave da credencial de API." };
      if (resposta.status === 403)
        return { ok: false, erro: "InvGate respondeu 403: verifique se a permissão API está ativada para a credencial e se ela pode consultar este chamado." };
      return { ok: false, erro: `InvGate respondeu ${resposta.status}. Tente novamente mais tarde.` };
    }

    let bruto: unknown;
    try {
      bruto = await resposta.json();
    } catch {
      return { ok: false, erro: "Resposta do InvGate em formato inesperado." };
    }

    if (!bruto || typeof bruto !== "object")
      return { ok: false, erro: "Resposta do InvGate em formato inesperado." };
    const raiz = bruto as Record<string, unknown>;
    if (raiz["error"] || raiz["errors"] || raiz["success"] === false)
      return { ok: false, erro: "O InvGate recusou a consulta. Verifique a credencial e o número do chamado." };
    const alvo = raiz["incident"] ?? raiz["data"] ?? raiz;
    const registro = Array.isArray(alvo) ? alvo[0] : alvo;
    if (!registro || typeof registro !== "object" || !Object.keys(registro).length)
      return { ok: false, erro: `Chamado ${numero} não encontrado no InvGate.` };
    const campos = registro as Record<string, unknown>;

    return {
      ok: true,
      chamado: {
        numero,
        titulo: primeiro(campos, ["title", "subject", "summary", "name"]),
        status: primeiro(campos, ["status", "state", "incident.status"]),
        prioridade: primeiro(campos, ["priority", "urgency", "impact"]),
        categoria: primeiro(campos, ["category", "categoryName", "service"]),
        solicitante: primeiro(campos, ["requester", "created_by", "customer", "author"]),
        criado_em: primeiro(campos, ["created_at", "creation_date", "createdDate", "date"]),
        url: `${base}/incident/${encodeURIComponent(numero)}`,
        consultado_em: new Date().toISOString(),
      },
    };
  });
