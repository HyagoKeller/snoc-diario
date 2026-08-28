import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const MESES = [
  "01-Janeiro",
  "02-Fevereiro",
  "03-Marco",
  "04-Abril",
  "05-Maio",
  "06-Junho",
  "07-Julho",
  "08-Agosto",
  "09-Setembro",
  "10-Outubro",
  "11-Novembro",
  "12-Dezembro",
];

export type SharepointResultado =
  | { ok: true; pasta: string; nome: string; webUrl: string | null }
  | { ok: false; erro: string };

export type SharepointStatus =
  | { ok: true; site: string; biblioteca: string; pastaBase: string }
  | { ok: false; erro: string };

type Cfg = { siteUrl: string; biblioteca: string; pastaRaiz: string };

async function lerConfig(supabase: {
  from: (t: "integracoes_config") => {
    select: (c: string) => {
      in: (col: string, vals: string[]) => Promise<{ data: { chave: string; valor: string }[] | null }>;
    };
  };
}): Promise<Cfg | string> {
  const { data } = await supabase
    .from("integracoes_config")
    .select("chave, valor")
    .in("chave", ["sharepoint_site_url", "sharepoint_biblioteca", "sharepoint_pasta_raiz"]);
  const map = new Map((data ?? []).map((r) => [r.chave, (r.valor ?? "").trim()]));
  const siteUrl = map.get("sharepoint_site_url") ?? "";
  if (!siteUrl) {
    return "SharePoint não configurado: informe a URL do site em Administração → Integrações.";
  }
  return {
    siteUrl,
    biblioteca: map.get("sharepoint_biblioteca") ?? "",
    pastaRaiz: (map.get("sharepoint_pasta_raiz") ?? "SNOC").replace(/^\/+|\/+$/g, ""),
  };
}

function credenciais(): { tenant: string; clientId: string; secret: string } | string {
  const tenant = process.env["SHAREPOINT_TENANT_ID"];
  const clientId = process.env["SHAREPOINT_CLIENT_ID"];
  const secret = process.env["SHAREPOINT_CLIENT_SECRET"];
  if (!tenant || !clientId || !secret) {
    return "Credenciais do SharePoint ausentes. Cadastre tenant, client id e client secret do aplicativo Entra ID.";
  }
  return { tenant, clientId, secret };
}

async function token(c: { tenant: string; clientId: string; secret: string }): Promise<string | { erro: string }> {
  const resp = await fetch(`https://login.microsoftonline.com/${c.tenant}/oauth2/v2.0/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: c.clientId,
      client_secret: c.secret,
      grant_type: "client_credentials",
      scope: "https://graph.microsoft.com/.default",
    }),
  });
  if (!resp.ok) {
    const corpo = await resp.text();
    console.error(`Entra ID ${resp.status}: ${corpo.slice(0, 500)}`);
    return { erro: `Falha ao autenticar no Microsoft 365 (${resp.status}). Verifique as credenciais.` };
  }
  const json = (await resp.json()) as { access_token?: string };
  if (!json.access_token) return { erro: "Microsoft 365 não devolveu token de acesso." };
  return json.access_token;
}

/** Resolve o site e o drive (biblioteca de documentos) configurados. */
async function resolverDrive(
  cfg: Cfg,
  bearer: string,
): Promise<{ siteId: string; driveId: string; driveNome: string } | { erro: string }> {
  let host = "";
  let caminho = "";
  try {
    const u = new URL(cfg.siteUrl);
    host = u.hostname;
    caminho = u.pathname.replace(/^\/+|\/+$/g, "");
  } catch {
    return { erro: "URL do site do SharePoint inválida. Use algo como https://contoso.sharepoint.com/sites/DTI" };
  }
  const alvo = caminho
    ? `https://graph.microsoft.com/v1.0/sites/${host}:/${caminho}`
    : `https://graph.microsoft.com/v1.0/sites/${host}`;
  const siteResp = await fetch(alvo, { headers: { Authorization: `Bearer ${bearer}` } });
  if (!siteResp.ok) {
    const corpo = await siteResp.text();
    console.error(`Graph site ${siteResp.status}: ${corpo.slice(0, 500)}`);
    return { erro: `Site do SharePoint não acessível (${siteResp.status}). Confira a URL e as permissões Sites.` };
  }
  const site = (await siteResp.json()) as { id?: string };
  if (!site.id) return { erro: "Não foi possível identificar o site do SharePoint." };

  const drivesResp = await fetch(`https://graph.microsoft.com/v1.0/sites/${site.id}/drives`, {
    headers: { Authorization: `Bearer ${bearer}` },
  });
  if (!drivesResp.ok) {
    const corpo = await drivesResp.text();
    console.error(`Graph drives ${drivesResp.status}: ${corpo.slice(0, 500)}`);
    return { erro: `Não foi possível listar as bibliotecas do site (${drivesResp.status}).` };
  }
  const drives = ((await drivesResp.json()) as { value?: { id: string; name: string }[] }).value ?? [];
  if (drives.length === 0) return { erro: "O site não possui bibliotecas de documentos." };
  const escolhido = cfg.biblioteca
    ? drives.find((d) => d.name.toLowerCase() === cfg.biblioteca.toLowerCase())
    : drives[0];
  if (!escolhido) {
    return {
      erro: `Biblioteca "${cfg.biblioteca}" não encontrada. Disponíveis: ${drives.map((d) => d.name).join(", ")}.`,
    };
  }
  return { siteId: site.id, driveId: escolhido.id, driveNome: escolhido.name };
}

/** Testa a configuração do SharePoint sem enviar arquivos. */
export const testarSharepoint = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<SharepointStatus> => {
    const cfg = await lerConfig(context.supabase as never);
    if (typeof cfg === "string") return { ok: false, erro: cfg };
    const cred = credenciais();
    if (typeof cred === "string") return { ok: false, erro: cred };
    const bearer = await token(cred);
    if (typeof bearer !== "string") return { ok: false, erro: bearer.erro };
    const drive = await resolverDrive(cfg, bearer);
    if ("erro" in drive) return { ok: false, erro: drive.erro };
    const agora = new Date();
    return {
      ok: true,
      site: cfg.siteUrl,
      biblioteca: drive.driveNome,
      pastaBase: `${cfg.pastaRaiz}/${agora.getUTCFullYear()}/${MESES[agora.getUTCMonth()]}`,
    };
  });

/** Envia um arquivo para o SharePoint em <raiz>/<ano>/<mes> e registra o vínculo. */
export const enviarArquivoSharepoint = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        nomeArquivo: z.string().min(1).max(180),
        conteudoBase64: z.string().min(1).max(20_000_000),
        entidade: z.string().min(1).max(40),
        entidadeId: z.string().uuid().optional(),
        subpasta: z.string().max(60).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }): Promise<SharepointResultado> => {
    const cfg = await lerConfig(context.supabase as never);
    if (typeof cfg === "string") return { ok: false, erro: cfg };
    const cred = credenciais();
    if (typeof cred === "string") return { ok: false, erro: cred };
    const bearer = await token(cred);
    if (typeof bearer !== "string") return { ok: false, erro: bearer.erro };
    const drive = await resolverDrive(cfg, bearer);
    if ("erro" in drive) return { ok: false, erro: drive.erro };

    const agora = new Date();
    const ano = String(agora.getUTCFullYear());
    const mes = MESES[agora.getUTCMonth()]!;
    const limpo = (s: string) => s.replace(/[\\/:*?"<>|#%]/g, "-").trim();
    const partes = [cfg.pastaRaiz, ano, mes, data.subpasta ? limpo(data.subpasta) : ""].filter(Boolean);
    const pasta = partes.join("/");
    const nome = `${agora.toISOString().slice(0, 19).replace(/[:T]/g, "-")}-${limpo(data.nomeArquivo)}`;

    const binario = Buffer.from(data.conteudoBase64, "base64");
    const url =
      `https://graph.microsoft.com/v1.0/drives/${drive.driveId}/root:/` +
      `${pasta.split("/").map(encodeURIComponent).join("/")}/${encodeURIComponent(nome)}:/content`;
    const resp = await fetch(url, {
      method: "PUT",
      headers: { Authorization: `Bearer ${bearer}`, "Content-Type": "application/octet-stream" },
      body: binario,
    });
    if (!resp.ok) {
      const corpo = await resp.text();
      console.error(`Graph upload ${resp.status}: ${corpo.slice(0, 500)}`);
      return { ok: false, erro: `SharePoint recusou o envio (${resp.status}). ${corpo.slice(0, 200)}` };
    }
    const item = (await resp.json()) as { webUrl?: string; size?: number };

    const { error } = await context.supabase.from("arquivos_externos").insert({
      entidade: data.entidade,
      entidade_id: data.entidadeId ?? null,
      destino: "sharepoint",
      pasta,
      nome_arquivo: nome,
      web_url: item.webUrl ?? null,
      tamanho_bytes: item.size ?? binario.byteLength,
      enviado_por: context.userId,
    });
    if (error) console.error("Falha ao registrar arquivo externo", error);

    return { ok: true, pasta, nome, webUrl: item.webUrl ?? null };
  });
