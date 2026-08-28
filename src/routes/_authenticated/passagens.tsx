import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, Check, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { dispararNotificacao, registrarAuditoria, tecnicosDoTurno } from "@/lib/notificacoes";
import {
  CRITICIDADE_LABEL,
  TURNOS,
  fmtDate,
  fmtDateTime,
  proximoTurno,
  turnoAtual,
  type Criticidade,
} from "@/lib/snoc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/passagens")({
  head: () => ({
    meta: [
      { title: "Passagem de turno | SNOC" },
      {
        name: "description",
        content: "Passagem de turno formalizada com prazo de aceite e escalonamento automático para a chefia.",
      },
      { property: "og:title", content: "Passagem de turno do SNOC" },
      { property: "og:description", content: "Aceite com prazo, pendências e escalonamento em níveis." },
    ],
  }),
  component: Passagens,
});

type Pendencia = { descricao: string; responsavel: string; prazo: string; risco: Criticidade };

function Passagens() {
  const { user, profile } = useAuth();
  const qc = useQueryClient();
  const [aberto, setAberto] = useState(false);
  const [turno, setTurno] = useState(turnoAtual());
  const [recebeId, setRecebeId] = useState<string>("");
  const [prazoMin, setPrazoMin] = useState("15");
  const [statusSistemas, setStatusSistemas] = useState("");
  const [incidentes, setIncidentes] = useState("");
  const [mudancas, setMudancas] = useState("");
  const [pendencias, setPendencias] = useState<Pendencia[]>([]);
  const [tier0, setTier0] = useState("");
  const [conting, setConting] = useState(false);
  const [contingDesc, setContingDesc] = useState("");
  const [busy, setBusy] = useState(false);

  const { data } = useQuery({
    queryKey: ["passagens"],
    queryFn: async () => {
      const [{ data: passagens }, { data: pend }, { data: perfis }] = await Promise.all([
        supabase.from("passagens_turno").select("*").order("created_at", { ascending: false }),
        supabase.from("passagem_pendencias").select("*"),
        supabase.from("profiles").select("id,nome,email").eq("ativo", true),
      ]);
      return { passagens: passagens ?? [], pendencias: pend ?? [], perfis: perfis ?? [] };
    },
  });

  const passagens = data?.passagens ?? [];
  const perfis = data?.perfis ?? [];
  const turnoDestino = proximoTurno(turno);

  const { data: escala } = useQuery({
    queryKey: ["escala-turno", turnoDestino],
    queryFn: () => tecnicosDoTurno(turnoDestino),
  });

  useEffect(() => {
    const candidato = (escala ?? []).find((t) => t.user_id !== user?.id);
    if (candidato) setRecebeId(candidato.user_id);
  }, [escala, user?.id]);

  async function criar() {
    if (!user) return;
    setBusy(true);
    try {
      const prazo = new Date(Date.now() + Number(prazoMin || 15) * 60000).toISOString();
      const { data: p, error } = await supabase
        .from("passagens_turno")
        .insert({
          turno,
          operador_entrega_id: user.id,
          operador_recebe_id: recebeId || null,
          status_sistemas: statusSistemas || null,
          incidentes_ativos: incidentes || null,
          mudancas_realizadas: mudancas || null,
          status_servicos_tier0: tier0 || null,
          contingencia_ativa: conting,
          contingencia_descricao: conting ? contingDesc || null : null,
          prazo_aceite: prazo,
        })
        .select()
        .single();
      if (error) throw error;

      if (pendencias.length) {
        await supabase.from("passagem_pendencias").insert(
          pendencias.map((x) => ({
            passagem_id: p.id,
            descricao: x.descricao,
            responsavel: x.responsavel || null,
            prazo: x.prazo || null,
            risco: x.risco,
          })),
        );
      }
      await registrarAuditoria("criar", "passagens_turno", p.id, { turno, turnoDestino });

      const destinoEmail = perfis.find((x) => x.id === (recebeId || null))?.email;
      const enviados = await dispararNotificacao(
        "passagem_enviada",
        `[SNOC] Passagem do turno ${turno} para o turno ${turnoDestino}`,
        `A passagem do turno ${turno} foi registrada por ${profile?.nome ?? "operador"} e aguarda aceite do técnico escalado para o turno ${turnoDestino} até ${new Date(prazo).toLocaleString("pt-BR")}.`,
        { tipo: "passagem_turno", id: p.id },
        destinoEmail ? [destinoEmail] : [],
        { turno: turnoDestino },
      );

      if (!destinoEmail || enviados === 0) {
        await dispararNotificacao(
          "passagem_sem_destinatario",
          `[SNOC] Passagem do turno ${turno} sem técnico escalado`,
          `Não foi possível notificar um técnico do turno ${turnoDestino}. Verifique a escala em Administração › Turnos e equipes.`,
          { tipo: "passagem_turno", id: p.id },
          [],
          { turno: turnoDestino },
        );
        toast.warning("Passagem registrada, mas sem técnico escalado no próximo turno — gerência notificada.");
      } else {
        toast.success(`Passagem registrada e enviada para ${enviados} destinatário(s) do turno ${turnoDestino}.`);
      }
      setAberto(false);
      setPendencias([]);
      setStatusSistemas("");
      setIncidentes("");
      setMudancas("");
      setTier0("");
      setConting(false);
      setContingDesc("");
      qc.invalidateQueries({ queryKey: ["passagens"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao registrar passagem");
    } finally {
      setBusy(false);
    }
  }

  async function aceitar(id: string) {
    const { error } = await supabase
      .from("passagens_turno")
      .update({ status_aceite: "aceito", aceito_em: new Date().toISOString(), operador_recebe_id: user?.id ?? null })
      .eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    await registrarAuditoria("aceitar", "passagens_turno", id);
    toast.success("Passagem aceita");
    qc.invalidateQueries({ queryKey: ["passagens"] });
  }

  async function escalonar(id: string, turnoP: string) {
    const enviados = await dispararNotificacao(
      "passagem_sem_aceite",
      "[SNOC] Passagem de turno sem aceite no prazo",
      `A passagem do turno ${turnoP} não recebeu aceite dentro do prazo configurado. Registrada por ${profile?.nome ?? "operador"}.`,
      { tipo: "passagem_turno", id },
    );
    await supabase.from("passagens_turno").update({ status_aceite: "escalonado" }).eq("id", id);
    await registrarAuditoria("escalonar", "passagens_turno", id, { destinatarios: enviados });
    toast[enviados ? "success" : "warning"](
      enviados
        ? `Escalonamento disparado para ${enviados} destinatário(s).`
        : "Sem regra de escalonamento cadastrada para 'passagem_sem_aceite'.",
    );
    qc.invalidateQueries({ queryKey: ["passagens"] });
  }

  const nome = (id?: string | null) => perfis.find((p) => p.id === id)?.nome ?? "—";
  const pendDe = (id: string) => (data?.pendencias ?? []).filter((p) => p.passagem_id === id);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="label-mono">Módulo 3.2</p>
          <h1 className="mt-1 text-2xl font-bold">Passagem de turno</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sem aceite dentro do prazo, o sistema escalona para a chefia configurada pelo Super Admin.
          </p>
        </div>
        <Button onClick={() => setAberto((v) => !v)}>
          <Plus className="size-4" /> {aberto ? "Fechar formulário" : "Nova passagem"}
        </Button>
      </header>

      {aberto ? (
        <section className="panel space-y-4 p-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Turno que entrega</Label>
              <Select value={turno} onValueChange={setTurno}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TURNOS.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Operador que recebe</Label>
              <Select value={recebeId} onValueChange={setRecebeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar" />
                </SelectTrigger>
                <SelectContent>
                  {perfis
                    .filter((p) => p.id !== user?.id)
                    .map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.nome || p.email}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Prazo de aceite (minutos)</Label>
              <Input
                type="number"
                min={5}
                value={prazoMin}
                onChange={(e) => setPrazoMin(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Status dos sistemas (degradado, bypass, indisponível)</Label>
            <Textarea value={statusSistemas} onChange={(e) => setStatusSistemas(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Incidentes ativos (severidade, impacto, timeline, mitigação, próximo passo)</Label>
            <Textarea value={incidentes} onChange={(e) => setIncidentes(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Mudanças realizadas no turno</Label>
            <Textarea value={mudancas} onChange={(e) => setMudancas(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Status dos serviços Tier 0 (críticos indisponíveis afetam a Advocacia)</Label>
            <Textarea
              value={tier0}
              onChange={(e) => setTier0(e.target.value)}
              placeholder="Sapiens: normal · e-AGU: normal · SEI: degradado"
            />
          </div>
          <label className="flex items-start gap-3 rounded-md border border-border p-3 text-sm">
            <Checkbox checked={conting} onCheckedChange={(v) => setConting(v === true)} />
            <span className="text-muted-foreground">
              Turno encerrado com plano de contingência ativo (link redundante, gerador, bypass,
              operação manual).
            </span>
          </label>
          {conting ? (
            <div className="space-y-2">
              <Label>Descrição da contingência ativa</Label>
              <Textarea value={contingDesc} onChange={(e) => setContingDesc(e.target.value)} />
            </div>
          ) : null}

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Pendências transferidas</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setPendencias((p) => [
                    ...p,
                    { descricao: "", responsavel: "", prazo: "", risco: "baixa" },
                  ])
                }
              >
                <Plus className="size-4" /> Adicionar
              </Button>
            </div>
            {pendencias.map((p, idx) => (
              <div key={idx} className="grid gap-2 rounded-md border border-border p-3 sm:grid-cols-4">
                <Input
                  placeholder="Descrição"
                  value={p.descricao}
                  onChange={(e) =>
                    setPendencias((prev) =>
                      prev.map((x, i) => (i === idx ? { ...x, descricao: e.target.value } : x)),
                    )
                  }
                />
                <Input
                  placeholder="Responsável"
                  value={p.responsavel}
                  onChange={(e) =>
                    setPendencias((prev) =>
                      prev.map((x, i) => (i === idx ? { ...x, responsavel: e.target.value } : x)),
                    )
                  }
                />
                <Input
                  type="date"
                  value={p.prazo}
                  onChange={(e) =>
                    setPendencias((prev) =>
                      prev.map((x, i) => (i === idx ? { ...x, prazo: e.target.value } : x)),
                    )
                  }
                />
                <Select
                  value={p.risco}
                  onValueChange={(v) =>
                    setPendencias((prev) =>
                      prev.map((x, i) => (i === idx ? { ...x, risco: v as Criticidade } : x)),
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(["baixa", "media", "alta", "critica"] as Criticidade[]).map((c) => (
                      <SelectItem key={c} value={c}>
                        {CRITICIDADE_LABEL[c]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>

          <Button onClick={criar} disabled={busy}>
            {busy ? "Registrando…" : "Registrar passagem"}
          </Button>
        </section>
      ) : null}

      <div className="space-y-3">
        {passagens.map((p) => {
          const atrasada = p.status_aceite === "pendente" && new Date(p.prazo_aceite) < new Date();
          return (
            <article key={p.id} className="panel p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">
                    {fmtDate(p.data)} · {p.turno}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Entrega: {nome(p.operador_entrega_id)} → Recebe: {nome(p.operador_recebe_id)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Prazo de aceite: {fmtDateTime(p.prazo_aceite)}
                    {p.aceito_em ? ` · Aceita em ${fmtDateTime(p.aceito_em)}` : ""}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant={
                      p.status_aceite === "aceito"
                        ? "secondary"
                        : p.status_aceite === "escalonado"
                          ? "destructive"
                          : "outline"
                    }
                  >
                    {p.status_aceite === "aceito"
                      ? "Aceita"
                      : p.status_aceite === "escalonado"
                        ? "Escalonada"
                        : "Aguardando aceite"}
                  </Badge>
                  {p.status_aceite === "pendente" && p.operador_entrega_id !== user?.id ? (
                    <Button size="sm" onClick={() => aceitar(p.id)}>
                      <Check className="size-4" /> Aceitar
                    </Button>
                  ) : null}
                  {atrasada ? (
                    <Button size="sm" variant="destructive" onClick={() => escalonar(p.id, p.turno)}>
                      <AlertTriangle className="size-4" /> Escalonar
                    </Button>
                  ) : null}
                </div>
              </div>

              {p.contingencia_ativa ? (
                <div className="mt-4 rounded-md border border-critico/50 bg-critico/10 p-3 text-sm">
                  <p className="flex items-center gap-2 font-semibold text-critico">
                    <AlertTriangle className="size-4" /> Contingência ativa
                  </p>
                  <p className="mt-1 text-muted-foreground">
                    {p.contingencia_descricao || "Sem descrição registrada."}
                  </p>
                </div>
              ) : null}

              <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <dt className="label-mono">Sistemas</dt>
                  <dd className="mt-1 text-muted-foreground">{p.status_sistemas || "—"}</dd>
                </div>
                <div>
                  <dt className="label-mono">Serviços Tier 0</dt>
                  <dd className="mt-1 text-muted-foreground">{p.status_servicos_tier0 || "—"}</dd>
                </div>
                <div>
                  <dt className="label-mono">Incidentes ativos</dt>
                  <dd className="mt-1 text-muted-foreground">{p.incidentes_ativos || "—"}</dd>
                </div>
                <div>
                  <dt className="label-mono">Mudanças</dt>
                  <dd className="mt-1 text-muted-foreground">{p.mudancas_realizadas || "—"}</dd>
                </div>
              </dl>

              {pendDe(p.id).length ? (
                <ul className="mt-4 space-y-1 border-t border-border pt-3 text-sm">
                  {pendDe(p.id).map((x) => (
                    <li key={x.id} className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">{CRITICIDADE_LABEL[x.risco]}</Badge>
                      <span>{x.descricao}</span>
                      <span className="text-xs text-muted-foreground">
                        {x.responsavel ? `· ${x.responsavel}` : ""} {x.prazo ? `· até ${fmtDate(x.prazo)}` : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </article>
          );
        })}
        {passagens.length === 0 ? (
          <p className="panel p-6 text-sm text-muted-foreground">Nenhuma passagem registrada.</p>
        ) : null}
      </div>
    </div>
  );
}
