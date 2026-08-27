import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Download, FileText, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { gerarPdfConsolidado } from "@/lib/pdf";
import { useAuth } from "@/hooks/useAuth";
import { registrarAuditoria } from "@/lib/notificacoes";
import { CRITICIDADE_LABEL, fmtDateTime, periodoRefAnterior } from "@/lib/snoc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/relatorios")({
  head: () => ({
    meta: [
      { title: "Relatórios mensais | SNOC OPS" },
      {
        name: "description",
        content: "Fechamento mensal consolidado de rondas, passagem de turno, terceiros e ordens de serviço.",
      },
      { property: "og:title", content: "Relatórios mensais do SNOC" },
      { property: "og:description", content: "Histórico consolidado mês a mês, pesquisável e arquivado." },
    ],
  }),
  component: Relatorios,
});

type Consolidado = {
  rondas: { total: number; nc_total: number; por_criticidade: Record<string, number>; secao_top: string };
  passagem: { total: number; no_prazo: number; escalonadas: number; pendencias_abertas: number };
  terceiros: { visitas: number; tempo_medio_min: number; checkouts_atraso: number };
  atividades: { abertas: number; fechadas: number; evidencia_completa: number };
};

function Relatorios() {
  const { isManager } = useAuth();
  const qc = useQueryClient();
  const [periodo, setPeriodo] = useState(periodoRefAnterior());
  const [busy, setBusy] = useState(false);

  const { data: relatorios = [] } = useQuery({
    queryKey: ["relatorios"],
    queryFn: async () => {
      const { data } = await supabase
        .from("relatorios_mensais")
        .select("*")
        .order("gerado_em", { ascending: false });
      return data ?? [];
    },
  });

  async function gerar() {
    setBusy(true);
    try {
      const inicio = `${periodo}-01T00:00:00.000Z`;
      const d = new Date(inicio);
      d.setMonth(d.getMonth() + 1);
      const fim = d.toISOString();

      const [rondas, itens, passagens, pend, visitas, atividades, evid] = await Promise.all([
        supabase.from("rondas").select("*").gte("created_at", inicio).lt("created_at", fim),
        supabase.from("ronda_itens").select("*").gte("created_at", inicio).lt("created_at", fim),
        supabase.from("passagens_turno").select("*").gte("created_at", inicio).lt("created_at", fim),
        supabase.from("passagem_pendencias").select("*").eq("resolvida", false),
        supabase.from("visitas").select("*").gte("checkin_em", inicio).lt("checkin_em", fim),
        supabase.from("atividades").select("*").gte("aberta_em", inicio).lt("aberta_em", fim),
        supabase.from("atividade_evidencias").select("*"),
      ]);

      const ncs = (itens.data ?? []).filter((i) => i.status === "NC");
      const contagemSecao = new Map<string, number>();
      for (const n of ncs) contagemSecao.set(n.secao, (contagemSecao.get(n.secao) ?? 0) + 1);
      const secaoTop = [...contagemSecao.entries()].sort((a, b) => b[1] - a[1])[0];

      const ps = passagens.data ?? [];
      const vs = visitas.data ?? [];
      const ats = atividades.data ?? [];
      const evs = evid.data ?? [];

      const consolidado: Consolidado = {
        rondas: {
          total: (rondas.data ?? []).length,
          nc_total: ncs.length,
          por_criticidade: Object.fromEntries(
            (["baixa", "media", "alta", "critica"] as const).map((c) => [
              c,
              ncs.filter((n) => n.criticidade === c).length,
            ]),
          ),
          secao_top: secaoTop ? `${secaoTop[0]} (${secaoTop[1]} NC)` : "sem NC no período",
        },
        passagem: {
          total: ps.length,
          no_prazo: ps.filter((p) => p.aceito_em && p.aceito_em <= p.prazo_aceite).length,
          escalonadas: ps.filter((p) => p.status_aceite === "escalonado").length,
          pendencias_abertas: (pend.data ?? []).length,
        },
        terceiros: {
          visitas: vs.length,
          tempo_medio_min: vs.length
            ? Math.round(
                vs.reduce(
                  (acc, v) =>
                    acc +
                    (v.checkout_em
                      ? (new Date(v.checkout_em).getTime() - new Date(v.checkin_em).getTime()) / 60000
                      : 0),
                  0,
                ) / vs.length,
              )
            : 0,
          checkouts_atraso: vs.filter(
            (v) =>
              v.checkout_em &&
              (new Date(v.checkout_em).getTime() - new Date(v.checkin_em).getTime()) / 60000 >
                (v.duracao_prevista_min ?? 120),
          ).length,
        },
        atividades: {
          abertas: ats.length,
          fechadas: ats.filter((a) => a.status === "fechada").length,
          evidencia_completa: ats.filter(
            (a) =>
              evs.some((e) => e.atividade_id === a.id && e.tipo === "antes") &&
              evs.some((e) => e.atividade_id === a.id && e.tipo === "depois"),
          ).length,
        },
      };

      const { data: regras } = await supabase
        .from("regras_escalonamento")
        .select("destinatarios")
        .eq("evento", "relatorio_mensal")
        .eq("ativa", true);
      const destinatarios = (regras ?? []).map((r) => r.destinatarios).join(", ");

      const { error } = await supabase.from("relatorios_mensais").insert({
        tipo: "consolidado",
        periodo_referencia: periodo,
        conteudo: consolidado as never,
        destinatarios: destinatarios || null,
      });
      if (error) throw error;
      await registrarAuditoria("gerar_relatorio", "relatorios_mensais", null, { periodo });
      toast.success(`Relatório de ${periodo} consolidado e arquivado.`);
      qc.invalidateQueries({ queryKey: ["relatorios"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao gerar relatório");
    } finally {
      setBusy(false);
    }
  }

  if (!isManager) {
    return (
      <p className="panel p-6 text-sm text-muted-foreground">
        Esta área é restrita a Gestor e Super Admin.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="label-mono">Módulo 3.7</p>
        <h1 className="mt-1 text-2xl font-bold">Fechamento mensal</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          O fechamento roda automaticamente no dia 1º e fica arquivado aqui, mês a mês. Também é
          possível consolidar um período manualmente.
        </p>
      </header>

      <section className="panel flex flex-wrap items-end gap-4 p-5">
        <div className="space-y-2">
          <Label>Período de referência</Label>
          <Input
            type="month"
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value)}
            className="w-48"
          />
        </div>
        <Button onClick={gerar} disabled={busy}>
          <RefreshCw className="size-4" /> {busy ? "Consolidando…" : "Gerar consolidado"}
        </Button>
      </section>

      <div className="space-y-4">
        {relatorios.map((r) => {
          const c = r.conteudo as unknown as Consolidado | null;
          return (
            <article key={r.id} className="panel p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <FileText className="size-5 text-primary" />
                  <div>
                    <p className="font-semibold">Consolidado {r.periodo_referencia}</p>
                    <p className="text-xs text-muted-foreground">
                      Gerado {fmtDateTime(r.gerado_em)} · destinatários: {r.destinatarios || "não configurados"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{r.tipo}</Badge>
                  {c ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => gerarPdfConsolidado(r.periodo_referencia, c, r.gerado_em)}
                    >
                      <Download className="size-4" /> PDF
                    </Button>
                  ) : null}
                </div>
              </div>

              {c ? (
                <div className="mt-4 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <p className="label-mono">Rondas</p>
                    <p className="mt-1 text-muted-foreground">
                      {c.rondas.total} rondas · {c.rondas.nc_total} NC
                      <br />
                      {(["baixa", "media", "alta", "critica"] as const)
                        .map((k) => `${CRITICIDADE_LABEL[k]}: ${c.rondas.por_criticidade[k] ?? 0}`)
                        .join(" · ")}
                      <br />
                      Maior recorrência: {c.rondas.secao_top}
                    </p>
                  </div>
                  <div>
                    <p className="label-mono">Passagem de turno</p>
                    <p className="mt-1 text-muted-foreground">
                      {c.passagem.total} passagens · {c.passagem.no_prazo} no prazo
                      <br />
                      {c.passagem.escalonadas} escalonadas
                      <br />
                      {c.passagem.pendencias_abertas} pendências abertas
                    </p>
                  </div>
                  <div>
                    <p className="label-mono">Terceiros</p>
                    <p className="mt-1 text-muted-foreground">
                      {c.terceiros.visitas} visitas · {c.terceiros.tempo_medio_min} min em média
                      <br />
                      {c.terceiros.checkouts_atraso} check-outs em atraso
                    </p>
                  </div>
                  <div>
                    <p className="label-mono">Atividades / OS</p>
                    <p className="mt-1 text-muted-foreground">
                      {c.atividades.abertas} abertas · {c.atividades.fechadas} fechadas
                      <br />
                      {c.atividades.evidencia_completa} com evidência completa
                    </p>
                  </div>
                </div>
              ) : null}
            </article>
          );
        })}
        {relatorios.length === 0 ? (
          <p className="panel p-6 text-sm text-muted-foreground">
            Nenhum relatório arquivado ainda.
          </p>
        ) : null}
      </div>
    </div>
  );
}
