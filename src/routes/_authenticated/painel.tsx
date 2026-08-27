import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AlertTriangle, ClipboardCheck, Repeat2, ShieldCheck, Wrench } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CRITICIDADE_LABEL, fmtDate, fmtDateTime, minutosEntre, turnoAtual } from "@/lib/snoc";

export const Route = createFileRoute("/_authenticated/painel")({
  head: () => ({
    meta: [
      { title: "Painel operacional | SNOC OPS" },
      {
        name: "description",
        content: "Fila do turno, indicadores de não conformidade, SLA de passagem de turno e terceiros em campo.",
      },
      { property: "og:title", content: "Painel operacional do SNOC" },
      { property: "og:description", content: "Visão do turno e indicadores consolidados do Data Center." },
    ],
  }),
  component: Painel,
});

function Card({
  titulo,
  valor,
  detalhe,
  tone = "default",
  icon: Icon,
}: {
  titulo: string;
  valor: string | number;
  detalhe?: string;
  tone?: "default" | "ok" | "atencao" | "critico";
  icon?: React.ElementType;
}) {
  const toneClass =
    tone === "critico"
      ? "text-critico"
      : tone === "atencao"
        ? "text-atencao"
        : tone === "ok"
          ? "text-ok"
          : "text-primary";
  const tileClass =
    tone === "critico"
      ? "bg-critico/15 text-critico"
      : tone === "atencao"
        ? "bg-atencao/15 text-atencao"
        : tone === "ok"
          ? "bg-ok/15 text-ok"
          : "bg-primary/15 text-primary";
  return (
    <div className="panel p-5 transition-colors hover:border-primary/40">
      <div className="flex items-center gap-3">
        {Icon ? (
          <span className={`flex size-9 items-center justify-center rounded-md ${tileClass}`}>
            <Icon className="size-4" />
          </span>
        ) : null}
        <p className="label-mono">{titulo}</p>
      </div>
      <p className={`mt-3 font-display text-3xl font-bold ${toneClass}`}>{valor}</p>
      {detalhe ? <p className="mt-1 text-xs text-muted-foreground">{detalhe}</p> : null}
    </div>
  );

}

function Painel() {
  const { profile, isManager, user } = useAuth();

  const { data } = useQuery({
    queryKey: ["painel", user?.id],
    queryFn: async () => {
      const desde = new Date(Date.now() - 30 * 864e5).toISOString();
      const [rondas, itens, passagens, visitas, atividades] = await Promise.all([
        supabase.from("rondas").select("*").gte("created_at", desde).order("created_at", { ascending: false }),
        supabase.from("ronda_itens").select("secao,status,criticidade,created_at").gte("created_at", desde),
        supabase.from("passagens_turno").select("*").order("created_at", { ascending: false }).limit(50),
        supabase.from("visitas").select("*").order("checkin_em", { ascending: false }).limit(50),
        supabase.from("atividades").select("*").order("aberta_em", { ascending: false }).limit(50),
      ]);
      return {
        rondas: rondas.data ?? [],
        itens: itens.data ?? [],
        passagens: passagens.data ?? [],
        visitas: visitas.data ?? [],
        atividades: atividades.data ?? [],
      };
    },
  });

  const rondas = data?.rondas ?? [];
  const itens = data?.itens ?? [];
  const passagens = data?.passagens ?? [];
  const visitas = data?.visitas ?? [];
  const atividades = data?.atividades ?? [];

  const ncPorCriticidade = (["baixa", "media", "alta", "critica"] as const).map((c) => ({
    nome: CRITICIDADE_LABEL[c],
    total: itens.filter((i) => i.status === "NC" && i.criticidade === c).length,
  }));

  const serieClima = rondas
    .filter((r) => r.temperatura != null)
    .slice(0, 20)
    .reverse()
    .map((r) => ({
      dia: fmtDate(r.data),
      temperatura: Number(r.temperatura),
      umidade: r.umidade != null ? Number(r.umidade) : null,
    }));

  const aceitasNoPrazo = passagens.filter(
    (p) => p.status_aceite === "aceito" && p.aceito_em && p.aceito_em <= p.prazo_aceite,
  ).length;
  const sla = passagens.length ? Math.round((aceitasNoPrazo / passagens.length) * 100) : 100;

  const emCampo = visitas.filter((v) => !v.checkout_em);
  const atrasados = emCampo.filter(
    (v) => minutosEntre(v.checkin_em) > (v.duracao_prevista_min ?? 120),
  );
  const abertas = atividades.filter((a) => !["fechada", "cancelada"].includes(a.status));
  const minhasAtividades = abertas.filter((a) => a.aberta_por === user?.id);
  const rondaHoje = rondas.find(
    (r) => r.data === new Date().toISOString().slice(0, 10) && r.turno === turnoAtual(),
  );
  const pendentesAceite = passagens.filter((p) => p.status_aceite === "pendente");
  const contingencia = passagens.find((p) => p.contingencia_ativa);

  return (
    <div className="space-y-6">
      <header>
        <p className="label-mono">{turnoAtual()}</p>
        <h1 className="mt-1 text-2xl font-bold">
          Olá, {profile?.nome?.split(" ")[0] || "operador"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isManager
            ? "Visão consolidada da operação do Data Center nos últimos 30 dias."
            : "Sua fila do turno e o que está em aberto sob sua responsabilidade."}
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card
          titulo="Ronda do turno atual"
          valor={rondaHoje ? (rondaHoje.finalizada ? "Concluída" : "Em aberto") : "Pendente"}
          detalhe={rondaHoje ? `${rondaHoje.total_nc} não conformidades` : "Nenhuma ronda iniciada"}
          tone={rondaHoje?.finalizada ? "ok" : "atencao"}
          icon={ClipboardCheck}
        />
        <Card
          titulo="Aceites pendentes"
          valor={pendentesAceite.length}
          detalhe={`SLA de aceite: ${sla}%`}
          tone={pendentesAceite.length ? "atencao" : "ok"}
          icon={Repeat2}
        />
        <Card
          titulo="Terceiros em campo"
          valor={emCampo.length}
          detalhe={atrasados.length ? `${atrasados.length} sem check-out no prazo` : "Nenhum atraso"}
          tone={atrasados.length ? "critico" : "ok"}
          icon={ShieldCheck}
        />
        <Card
          titulo={isManager ? "OS em aberto" : "Minhas OS em aberto"}
          valor={isManager ? abertas.length : minhasAtividades.length}
          detalhe={`${abertas.filter((a) => a.criticidade === "critica").length} críticas`}
          tone={abertas.some((a) => a.criticidade === "critica") ? "critico" : "default"}
          icon={Wrench}
        />
      </div>

      {contingencia ? (
        <div className="panel border-atencao/50 bg-atencao/10 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 size-5 text-atencao" />
            <div>
              <p className="font-semibold">Contingência ativa registrada na passagem de turno</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {contingencia.contingencia_descricao || "Sem descrição registrada."}
              </p>
              <Button asChild variant="outline" size="sm" className="mt-3">
                <Link to="/passagens">Ver passagem de turno</Link>
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {atrasados.length > 0 ? (
        <div className="panel border-critico/50 bg-critico/10 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 size-5 text-critico" />
            <div>
              <p className="font-semibold">Check-out em atraso</p>
              <ul className="mt-1 space-y-1 text-sm text-muted-foreground">
                {atrasados.map((v) => (
                  <li key={v.id}>
                    {v.pessoa_nome} — entrada {fmtDateTime(v.checkin_em)} ({minutosEntre(v.checkin_em)}{" "}
                    min, previsto {v.duracao_prevista_min} min)
                  </li>
                ))}
              </ul>
              <Button asChild variant="outline" size="sm" className="mt-3">
                <Link to="/terceiros">Abrir controle de acesso</Link>
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="panel p-5">
          <h2 className="text-base font-semibold">Não conformidades por criticidade (30 dias)</h2>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ncPorCriticidade}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="nome" stroke="var(--color-muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={12} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 8,
                    color: "var(--color-foreground)",
                  }}
                />
                <Bar dataKey="total" fill="var(--color-chart-1)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel p-5">
          <h2 className="text-base font-semibold">Tendência de temperatura e umidade</h2>
          <div className="mt-4 h-56">
            {serieClima.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={serieClima}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="dia" stroke="var(--color-muted-foreground)" fontSize={11} />
                  <YAxis stroke="var(--color-muted-foreground)" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--color-card)",
                      border: "1px solid var(--color-border)",
                      borderRadius: 8,
                    }}
                  />
                  <Area
                    dataKey="temperatura"
                    stroke="var(--color-chart-4)"
                    fill="var(--color-chart-4)"
                    fillOpacity={0.2}
                  />
                  <Area
                    dataKey="umidade"
                    stroke="var(--color-chart-2)"
                    fill="var(--color-chart-2)"
                    fillOpacity={0.15}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground">
                Sem leituras registradas ainda. Preencha temperatura e umidade em uma ronda.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="panel p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Últimas rondas</h2>
          <Button asChild size="sm" variant="outline">
            <Link to="/rondas">Ver todas</Link>
          </Button>
        </div>
        <div className="mt-4 divide-y divide-border">
          {rondas.slice(0, 6).map((r) => (
            <Link
              key={r.id}
              to="/rondas/$id"
              params={{ id: r.id }}
              className="flex items-center justify-between gap-3 py-3 text-sm hover:text-primary"
            >
              <span>
                {fmtDate(r.data)} · {r.turno}
              </span>
              <span className="flex items-center gap-2">
                <Badge variant="outline">{r.total_nc} NC</Badge>
                <Badge>{CRITICIDADE_LABEL[r.resultado_geral]}</Badge>
              </span>
            </Link>
          ))}
          {rondas.length === 0 ? (
            <p className="py-3 text-sm text-muted-foreground">Nenhuma ronda registrada.</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
