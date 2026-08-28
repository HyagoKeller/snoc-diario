import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { signedUrl, uploadEvidencia } from "@/lib/storage";
import { registrarAuditoria } from "@/lib/notificacoes";
import {
  ATIVIDADE_STATUS_LABEL,
  ATIVIDADE_TIPO_LABEL,
  CRITICIDADE_LABEL,
  fmtDateTime,
} from "@/lib/snoc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChamadoItsmCard } from "@/components/ChamadoItsmField";
import { fmtDate } from "@/lib/snoc";

export const Route = createFileRoute("/_authenticated/atividades/$id")({
  head: () => ({
    meta: [
      { title: "Ordem de serviço | SNOC" },
      { name: "description", content: "Evidências antes/depois, laudo do fornecedor e fechamento da OS." },
      { property: "og:title", content: "Ordem de serviço do SNOC" },
      { property: "og:description", content: "Registro auditável de execução com evidência fotográfica." },
    ],
  }),
  component: DetalheOS,
});

type EvidTipo = "antes" | "depois" | "laudo";

function DetalheOS() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [tipoEvid, setTipoEvid] = useState<EvidTipo>("antes");
  const [arquivo, setArquivo] = useState<File | undefined>();
  const [nota, setNota] = useState<File | undefined>();
  const [busy, setBusy] = useState(false);

  const { data } = useQuery({
    queryKey: ["atividade", id],
    queryFn: async () => {
      const [{ data: atividade }, { data: evid }, { data: visitas }] = await Promise.all([
        supabase.from("atividades").select("*").eq("id", id).maybeSingle(),
        supabase.from("atividade_evidencias").select("*").eq("atividade_id", id).order("enviado_em"),
        supabase.from("visitas").select("*").eq("atividade_id", id).order("checkin_em"),
      ]);
      const comUrl = await Promise.all(
        (evid ?? []).map(async (e) => ({ ...e, url: await signedUrl(e.arquivo_url) })),
      );
      let fornecedor = null;
      if (atividade?.fornecedor_id) {
        const { data: f } = await supabase
          .from("fornecedores")
          .select("*")
          .eq("id", atividade.fornecedor_id)
          .maybeSingle();
        fornecedor = f;
      }
      const notaUrl = atividade?.nota_fiscal_url
        ? await signedUrl(atividade.nota_fiscal_url)
        : null;
      return { atividade, evidencias: comUrl, visitas: visitas ?? [], fornecedor, notaUrl };
    },
  });

  const a = data?.atividade;
  const evidencias = data?.evidencias ?? [];
  const notaUrl = data?.notaUrl ?? null;

  async function enviarNota() {
    if (!nota) {
      toast.error("Selecione o arquivo da nota fiscal.");
      return;
    }
    setBusy(true);
    try {
      const path = await uploadEvidencia(nota, `atividades/${id}/nf`);
      const { error } = await supabase
        .from("atividades")
        .update({ nota_fiscal_url: path })
        .eq("id", id);
      if (error) throw error;
      await registrarAuditoria("anexar_nota_fiscal", "atividades", id);
      setNota(undefined);
      toast.success("Nota fiscal anexada");
      qc.invalidateQueries({ queryKey: ["atividade", id] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao anexar nota fiscal");
    } finally {
      setBusy(false);
    }
  }


  async function enviar() {
    if (!user || !arquivo) {
      toast.error("Selecione um arquivo.");
      return;
    }
    setBusy(true);
    try {
      const path = await uploadEvidencia(arquivo, `atividades/${id}`);
      const { error } = await supabase.from("atividade_evidencias").insert({
        atividade_id: id,
        tipo: tipoEvid,
        arquivo_url: path,
        enviado_por: user.id,
      });
      if (error) throw error;
      await registrarAuditoria("anexar_evidencia", "atividades", id, { tipo: tipoEvid });
      setArquivo(undefined);
      toast.success("Evidência anexada");
      qc.invalidateQueries({ queryKey: ["atividade", id] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao anexar");
    } finally {
      setBusy(false);
    }
  }

  async function fechar() {
    const temAntes = evidencias.some((e) => e.tipo === "antes");
    const temDepois = evidencias.some((e) => e.tipo === "depois");
    if (!temAntes || !temDepois) {
      toast.error("A OS só pode ser fechada com evidência fotográfica antes e depois.");
      return;
    }
    const semCheckout = (data?.visitas ?? []).some((v) => !v.checkout_em);
    if (semCheckout) {
      toast.error("Há prestador em campo sem check-out registrado.");
      return;
    }
    const { error } = await supabase
      .from("atividades")
      .update({ status: "fechada", fechada_em: new Date().toISOString() })
      .eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    await registrarAuditoria("fechar_os", "atividades", id);
    toast.success("OS fechada com evidência completa");
    qc.invalidateQueries({ queryKey: ["atividade", id] });
  }

  if (!a) return <p className="text-sm text-muted-foreground">Carregando OS…</p>;

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm">
        <Link to="/atividades">
          <ArrowLeft className="size-4" /> Atividades
        </Link>
      </Button>

      <header className="panel p-5">
        <p className="label-mono">{ATIVIDADE_TIPO_LABEL[a.tipo]}</p>
        <h1 className="mt-1 text-2xl font-bold">
          OS #{a.codigo} · {a.titulo}
        </h1>
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge variant="outline">{ATIVIDADE_STATUS_LABEL[a.status]}</Badge>
          <Badge variant="secondary">{CRITICIDADE_LABEL[a.criticidade]}</Badge>
          {a.email_enviado_em ? (
            <Badge variant="secondary">Fornecedor acionado {fmtDateTime(a.email_enviado_em)}</Badge>
          ) : (
            <Badge variant="outline">Fornecedor não acionado</Badge>
          )}
        </div>
        <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="label-mono">Ativo afetado</dt>
            <dd className="mt-1 text-muted-foreground">{a.ativo_afetado || "—"}</dd>
          </div>
          <div>
            <dt className="label-mono">Fornecedor</dt>
            <dd className="mt-1 text-muted-foreground">{data?.fornecedor?.razao_social ?? "—"}</dd>
          </div>
          <div>
            <dt className="label-mono">Janela</dt>
            <dd className="mt-1 text-muted-foreground">
              {fmtDateTime(a.janela_inicio)} → {fmtDateTime(a.janela_fim)}
            </dd>
          </div>
          <div>
            <dt className="label-mono">Fechamento</dt>
            <dd className="mt-1 text-muted-foreground">{fmtDateTime(a.fechada_em)}</dd>
          </div>
          <div>
            <dt className="label-mono">Nº OS do fornecedor</dt>
            <dd className="mt-1 text-muted-foreground">{a.numero_os_fornecedor || "—"}</dd>
          </div>
          <div>
            <dt className="label-mono">Custo</dt>
            <dd className="mt-1 text-muted-foreground">
              {a.custo != null
                ? Number(a.custo).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
                : "—"}
            </dd>
          </div>
          <div>
            <dt className="label-mono">Garantia até</dt>
            <dd className="mt-1 text-muted-foreground">
              {a.garantia_ate ? fmtDate(a.garantia_ate) : "—"}
            </dd>
          </div>
          <div>
            <dt className="label-mono">Nota fiscal</dt>
            <dd className="mt-1 text-muted-foreground">
              {notaUrl ? (
                <a href={notaUrl} target="_blank" rel="noreferrer" className="text-primary underline">
                  Abrir arquivo
                </a>
              ) : (
                "não anexada"
              )}
            </dd>
          </div>
        </dl>
        {a.chamado_itsm ? (
          <div className="mt-4">
            <ChamadoItsmCard numero={a.chamado_itsm} cache={a.chamado_itsm_cache} />
          </div>
        ) : null}
        {a.descricao ? <p className="mt-4 text-sm text-muted-foreground">{a.descricao}</p> : null}
      </header>

      <section className="panel space-y-3 p-5">
        <h2 className="text-base font-semibold">Nota fiscal / documento financeiro</h2>
        <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
          <div className="space-y-2">
            <Label htmlFor="nf">Arquivo (imagem ou PDF)</Label>
            <Input
              id="nf"
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => setNota(e.target.files?.[0])}
            />
          </div>
          <Button variant="outline" onClick={enviarNota} disabled={busy}>
            <Upload className="size-4" /> Anexar nota
          </Button>
        </div>
      </section>

      <section className="panel space-y-4 p-5">
        <h2 className="text-base font-semibold">Evidências</h2>
        <div className="grid gap-3 sm:grid-cols-[200px_1fr_auto] sm:items-end">
          <div className="space-y-2">
            <Label>Tipo</Label>
            <Select value={tipoEvid} onValueChange={(v) => setTipoEvid(v as EvidTipo)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="antes">Antes (peça/estado atual)</SelectItem>
                <SelectItem value="depois">Depois (peça instalada)</SelectItem>
                <SelectItem value="laudo">Laudo / formulário do fornecedor</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="arq">Arquivo (imagem ou PDF)</Label>
            <Input
              id="arq"
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => setArquivo(e.target.files?.[0])}
            />
          </div>
          <Button onClick={enviar} disabled={busy}>
            <Upload className="size-4" /> Anexar
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {(["antes", "depois", "laudo"] as EvidTipo[]).map((t) => (
            <div key={t} className="rounded-md border border-border p-3">
              <p className="label-mono">{t}</p>
              <div className="mt-2 space-y-2">
                {evidencias
                  .filter((e) => e.tipo === t)
                  .map((e) =>
                    e.arquivo_url.endsWith(".pdf") ? (
                      <a
                        key={e.id}
                        href={e.url ?? "#"}
                        target="_blank"
                        rel="noreferrer"
                        className="block text-sm text-primary underline"
                      >
                        Abrir documento ({fmtDateTime(e.enviado_em)})
                      </a>
                    ) : (
                      <img
                        key={e.id}
                        src={e.url ?? ""}
                        alt={`Evidência ${t} da OS ${a.codigo}`}
                        className="rounded-md border border-border"
                        loading="lazy"
                      />
                    ),
                  )}
                {evidencias.filter((e) => e.tipo === t).length === 0 ? (
                  <p className="text-xs text-muted-foreground">Nada anexado.</p>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="panel space-y-3 p-5">
        <h2 className="text-base font-semibold">Acessos vinculados a esta OS</h2>
        {(data?.visitas ?? []).map((v) => (
          <p key={v.id} className="text-sm text-muted-foreground">
            {v.pessoa_nome} · entrada {fmtDateTime(v.checkin_em)} · saída {fmtDateTime(v.checkout_em)}
          </p>
        ))}
        {(data?.visitas ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhum check-in vinculado. Registre no módulo de terceiros.
          </p>
        ) : null}
      </section>

      {a.status !== "fechada" ? (
        <Button size="lg" onClick={fechar}>
          Confirmar encerramento da OS
        </Button>
      ) : null}
    </div>
  );
}
