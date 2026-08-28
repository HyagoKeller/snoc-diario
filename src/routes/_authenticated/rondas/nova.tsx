import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Camera, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { uploadEvidencia } from "@/lib/storage";
import { dispararNotificacao, registrarAuditoria } from "@/lib/notificacoes";
import {
  CHECKLIST,
  CRITICIDADE_LABEL,
  TURNOS,
  turnoAtual,
  type Criticidade,
  type ItemStatus,
} from "@/lib/snoc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChamadoItsmField } from "@/components/ChamadoItsmField";
import type { ChamadoItsm } from "@/lib/invgate.functions";
import { fmtDate } from "@/lib/snoc";

export const Route = createFileRoute("/_authenticated/rondas/nova")({
  head: () => ({
    meta: [
      { title: "Nova ronda | SNOC" },
      { name: "description", content: "Registro de ronda operacional com evidência fotográfica por item." },
      { property: "og:title", content: "Nova ronda operacional" },
      { property: "og:description", content: "Checklist digital do Data Center com foto obrigatória em NC." },
    ],
  }),
  component: NovaRonda,
});

type ItemState = { status: ItemStatus; observacao: string; foto?: File | undefined };

const CRITS: Criticidade[] = ["baixa", "media", "alta", "critica"];

function NovaRonda() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [turno, setTurno] = useState(turnoAtual());
  const [localidade, setLocalidade] = useState("Data Center AGU");
  const [temperatura, setTemperatura] = useState("");
  const [umidade, setUmidade] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [busy, setBusy] = useState(false);
  const [chamado, setChamado] = useState("");
  const [chamadoCache, setChamadoCache] = useState<ChamadoItsm | null>(null);
  const [anteriorId, setAnteriorId] = useState("");

  const { data: anteriores = [] } = useQuery({
    queryKey: ["rondas-anteriores"],
    queryFn: async () => {
      const { data } = await supabase
        .from("rondas")
        .select("id,data,turno,total_nc")
        .order("created_at", { ascending: false })
        .limit(15);
      return data ?? [];
    },
  });

  const [itens, setItens] = useState<Record<string, ItemState>>(() => {
    const base: Record<string, ItemState> = {};
    for (const s of CHECKLIST)
      for (const i of s.itens) base[`${s.secao}||${i}`] = { status: "C", observacao: "" };
    return base;
  });
  const [criticidades, setCriticidades] = useState<Record<string, Criticidade>>(() =>
    Object.fromEntries(CHECKLIST.map((s) => [s.secao, "baixa" as Criticidade])),
  );

  const totalNC = Object.values(itens).filter((i) => i.status === "NC").length;
  const resultadoGeral =
    CRITS.filter((c) => Object.entries(criticidades).some(([secao, cc]) => {
      const temNC = CHECKLIST.find((s) => s.secao === secao)?.itens.some(
        (i) => itens[`${secao}||${i}`]?.status === "NC",
      );
      return temNC && cc === c;
    })).at(-1) ?? "baixa";

  function setItem(key: string, patch: Partial<ItemState>) {
    setItens((prev) => ({ ...prev, [key]: { ...prev[key]!, ...patch } }));
  }

  async function salvar() {
    if (!user) return;
    // Regra do formulário: NC exige observação e foto.
    for (const [key, st] of Object.entries(itens)) {
      if (st.status !== "NC") continue;
      if (!st.observacao.trim() || !st.foto) {
        toast.error(`Item "${key.split("||")[1]}" está NC: observação e foto são obrigatórias.`);
        return;
      }
    }
    setBusy(true);
    try {
      const { data: ronda, error } = await supabase
        .from("rondas")
        .insert({
          turno,
          localidade,
          responsavel_id: user.id,
          temperatura: temperatura ? Number(temperatura) : null,
          umidade: umidade ? Number(umidade) : null,
          observacoes: observacoes || null,
          chamado_itsm: chamado.trim() || null,
          chamado_itsm_cache: chamadoCache ? (chamadoCache as never) : null,
          ronda_anterior_id: anteriorId || null,
          total_nc: totalNC,
          resultado_geral: resultadoGeral,
          finalizada: true,
        })
        .select()
        .single();
      if (error) throw error;

      const rows = [];
      for (const [key, st] of Object.entries(itens)) {
        const [secao, item] = key.split("||");
        let foto_url: string | null = null;
        if (st.foto) foto_url = await uploadEvidencia(st.foto, `rondas/${ronda.id}`);
        rows.push({
          ronda_id: ronda.id,
          secao: secao!,
          item: item!,
          status: st.status,
          observacao: st.observacao || null,
          foto_url,
          criticidade: st.status === "NC" ? criticidades[secao!]! : null,
        });
      }
      const { error: errItens } = await supabase.from("ronda_itens").insert(rows);
      if (errItens) throw errItens;

      await registrarAuditoria("criar", "rondas", ronda.id, { total_nc: totalNC });

      const secoesCriticas = Object.entries(criticidades)
        .filter(([secao, c]) => {
          if (c !== "critica") return false;
          return CHECKLIST.find((s) => s.secao === secao)?.itens.some(
            (i) => itens[`${secao}||${i}`]?.status === "NC",
          );
        })
        .map(([s]) => s);

      if (secoesCriticas.length) {
        const enviados = await dispararNotificacao(
          "ronda_nc_critica",
          `[SNOC] NC CRÍTICA na ronda de ${new Date().toLocaleDateString("pt-BR")}`,
          `Ronda ${turno} em ${localidade} registrada por ${profile?.nome ?? "operador"} com NC crítica nas seções: ${secoesCriticas.join(", ")}. Total de NC: ${totalNC}. Abrir fila de incidente.`,
          { tipo: "ronda", id: ronda.id },
          [],
          { criticidade: "critica", turno },
        );
        toast.warning(
          enviados
            ? `NC crítica registrada — ${enviados} destinatário(s) notificado(s).`
            : "NC crítica registrada. Nenhuma regra de escalonamento cadastrada para este evento.",
        );
      }

      if (totalNC > 0) {
        await dispararNotificacao(
          "ronda_nc",
          `[SNOC] Ronda com ${totalNC} não conformidade(s) — ${turno}`,
          `Ronda ${turno} em ${localidade} registrada por ${profile?.nome ?? "operador"} com ${totalNC} não conformidade(s).`,
          { tipo: "ronda", id: ronda.id },
          [],
          { criticidade: secoesCriticas.length ? "critica" : "media", turno },
        );
      }

      toast.success("Ronda registrada");
      navigate({ to: "/rondas/$id", params: { id: ronda.id } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao salvar a ronda");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6 pb-16">
      <header>
        <p className="label-mono">Módulo 3.1 · formulário oficial digitalizado</p>
        <h1 className="mt-1 text-2xl font-bold">Nova ronda operacional</h1>
      </header>

      <div className="panel space-y-4 p-5">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Label>Turno</Label>
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
            <Label>Localidade</Label>
            <Input value={localidade} onChange={(e) => setLocalidade(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Temperatura (°C)</Label>
            <Input
              type="number"
              step="0.1"
              value={temperatura}
              onChange={(e) => setTemperatura(e.target.value)}
              placeholder="22.5"
            />
          </div>
          <div className="space-y-2">
            <Label>Umidade relativa (%)</Label>
            <Input
              type="number"
              step="0.1"
              value={umidade}
              onChange={(e) => setUmidade(e.target.value)}
              placeholder="50"
            />
          </div>
        </div>

        <div className="grid gap-4 border-t border-border pt-4 lg:grid-cols-2">
          <ChamadoItsmField
            numero={chamado}
            onNumero={setChamado}
            cache={chamadoCache}
            onCache={setChamadoCache}
          />
          <div className="space-y-2">
            <Label>Ronda anterior (comparação de tendência)</Label>
            <Select value={anteriorId} onValueChange={setAnteriorId}>
              <SelectTrigger>
                <SelectValue placeholder="Opcional — vincular à ronda anterior" />
              </SelectTrigger>
              <SelectContent>
                {anteriores.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {fmtDate(r.data)} · {r.turno} · {r.total_nc} NC
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {CHECKLIST.map((secao) => (
        <section key={secao.secao} className="panel p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-semibold">{secao.secao}</h2>
            <div className="flex items-center gap-2">
              <span className="label-mono">Criticidade da seção</span>
              <Select
                value={criticidades[secao.secao] ?? "baixa"}
                onValueChange={(v) =>
                  setCriticidades((p) => ({ ...p, [secao.secao]: v as Criticidade }))
                }
              >
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CRITS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {CRITICIDADE_LABEL[c]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-4 space-y-4">
            {secao.itens.map((item) => {
              const key = `${secao.secao}||${item}`;
              const st = itens[key]!;
              return (
                <div key={key} className="rounded-md border border-border p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <p className="text-sm">{item}</p>
                    <div className="flex gap-1">
                      {(["C", "NC", "NA"] as ItemStatus[]).map((s) => (
                        <Button
                          key={s}
                          type="button"
                          size="sm"
                          variant={st.status === s ? "default" : "outline"}
                          onClick={() => setItem(key, { status: s })}
                        >
                          {s}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {st.status === "NC" ? (
                    <div className="mt-3 space-y-3 border-t border-border pt-3">
                      <Textarea
                        placeholder="Descreva a não conformidade (obrigatório)"
                        value={st.observacao}
                        onChange={(e) => setItem(key, { observacao: e.target.value })}
                      />
                      <div className="flex flex-wrap items-center gap-3">
                        <Label
                          className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:bg-accent"
                          htmlFor={`foto-${key}`}
                        >
                          <Camera className="size-4" />
                          {st.foto ? "Trocar foto" : "Anexar foto (obrigatória)"}
                        </Label>
                        <input
                          id={`foto-${key}`}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => setItem(key, { foto: e.target.files?.[0] })}
                        />
                        {st.foto ? (
                          <span className="flex items-center gap-1 text-xs text-ok">
                            <Check className="size-3" /> {st.foto.name}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>
      ))}

      <section className="panel space-y-4 p-5">
        <h2 className="text-base font-semibold">Resumo automático</h2>
        <div className="flex flex-wrap gap-6 text-sm">
          <p>
            <span className="label-mono">Total de NC</span>
            <br />
            <span className="font-display text-2xl font-bold">{totalNC}</span>
          </p>
          <p>
            <span className="label-mono">Classificação geral</span>
            <br />
            <span className="font-display text-2xl font-bold">
              {CRITICIDADE_LABEL[resultadoGeral]}
            </span>
          </p>
        </div>
        <div className="space-y-2">
          <Label>Observações gerais / pendência transferida</Label>
          <Textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} />
        </div>
        <Button onClick={salvar} disabled={busy} size="lg">
          {busy ? "Salvando…" : "Finalizar ronda"}
        </Button>
      </section>
    </div>
  );
}
