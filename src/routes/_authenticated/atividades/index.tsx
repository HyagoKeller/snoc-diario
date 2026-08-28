import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { dispararNotificacao, registrarAuditoria } from "@/lib/notificacoes";
import {
  ATIVIDADE_STATUS_LABEL,
  ATIVIDADE_TIPO_LABEL,
  CRITICIDADE_LABEL,
  criticidadeToken,
  fmtDateTime,
  type Criticidade,
} from "@/lib/snoc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChamadoItsmField } from "@/components/ChamadoItsmField";
import type { ChamadoItsm } from "@/lib/invgate.functions";

export const Route = createFileRoute("/_authenticated/atividades/")({
  head: () => ({
    meta: [
      { title: "Atividades e ordens de serviço | SNOC" },
      {
        name: "description",
        content:
          "Abertura de OS com acionamento do fornecedor, evidência antes/depois e fechamento rastreável.",
      },
      { property: "og:title", content: "Atividades e OS do SNOC" },
      { property: "og:description", content: "Ciclo completo de troca de peça com evidência fotográfica." },
    ],
  }),
  component: Atividades,
});

type Tipo = "preventiva" | "corretiva" | "troca_peca" | "instalacao";

function Atividades() {
  const { user, profile } = useAuth();
  const qc = useQueryClient();
  const [aberto, setAberto] = useState(false);
  const [tipo, setTipo] = useState<Tipo>("troca_peca");
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [ativo, setAtivo] = useState("");
  const [criticidade, setCriticidade] = useState<Criticidade>("media");
  const [fornecedorId, setFornecedorId] = useState("");
  const [inicio, setInicio] = useState("");
  const [fim, setFim] = useState("");
  const [busy, setBusy] = useState(false);
  const [chamado, setChamado] = useState("");
  const [chamadoCache, setChamadoCache] = useState<ChamadoItsm | null>(null);
  const [osFornecedor, setOsFornecedor] = useState("");
  const [custo, setCusto] = useState("");
  const [garantia, setGarantia] = useState("");

  const { data } = useQuery({
    queryKey: ["atividades"],
    queryFn: async () => {
      const [{ data: atividades }, { data: fornecedores }] = await Promise.all([
        supabase.from("atividades").select("*").order("aberta_em", { ascending: false }),
        supabase.from("fornecedores").select("*").order("razao_social"),
      ]);
      return { atividades: atividades ?? [], fornecedores: fornecedores ?? [] };
    },
  });

  const atividades = data?.atividades ?? [];
  const fornecedores = data?.fornecedores ?? [];

  async function abrirOS() {
    if (!user) return;
    if (!titulo.trim()) {
      toast.error("Informe o título da atividade.");
      return;
    }
    setBusy(true);
    try {
      const { data: a, error } = await supabase
        .from("atividades")
        .insert({
          tipo,
          titulo,
          descricao: descricao || null,
          ativo_afetado: ativo || null,
          criticidade,
          fornecedor_id: fornecedorId || null,
          janela_inicio: inicio ? new Date(inicio).toISOString() : null,
          janela_fim: fim ? new Date(fim).toISOString() : null,
          aberta_por: user.id,
          status: inicio ? "agendada" : "aberta",
          chamado_itsm: chamado.trim() || null,
          chamado_itsm_cache: chamadoCache ? (chamadoCache as never) : null,
          numero_os_fornecedor: osFornecedor.trim() || null,
          custo: custo ? Number(custo) : null,
          garantia_ate: garantia || null,
        })
        .select()
        .single();
      if (error) throw error;

      const forn = fornecedores.find((f) => f.id === fornecedorId);
      const destinatarios = forn?.contato_email ? [forn.contato_email] : [];
      const enviados = await dispararNotificacao(
        "abertura_os",
        `[SNOC] OS #${a.codigo} — ${ATIVIDADE_TIPO_LABEL[tipo]} — ${titulo}`,
        `Ordem de serviço #${a.codigo} aberta por ${profile?.nome ?? "SNOC"}.
Tipo: ${ATIVIDADE_TIPO_LABEL[tipo]}
Ativo afetado: ${ativo || "não informado"}
Criticidade: ${CRITICIDADE_LABEL[criticidade]}
Janela de execução: ${inicio ? fmtDateTime(new Date(inicio).toISOString()) : "a combinar"} até ${fim ? fmtDateTime(new Date(fim).toISOString()) : "—"}
Descrição: ${descricao || "—"}

O acesso físico exige check-in no SNOC vinculado a esta OS, com evidência fotográfica antes e depois da intervenção.`,
        { tipo: "atividade", id: a.id },
        destinatarios,
      );
      if (enviados) {
        await supabase
          .from("atividades")
          .update({ email_enviado_em: new Date().toISOString() })
          .eq("id", a.id);
      }
      await registrarAuditoria("abrir_os", "atividades", a.id, { codigo: a.codigo });
      toast.success(
        enviados
          ? `OS #${a.codigo} aberta e acionamento registrado para ${enviados} destinatário(s).`
          : `OS #${a.codigo} aberta. Cadastre o e-mail do fornecedor para o acionamento automático.`,
      );
      setAberto(false);
      setTitulo("");
      setDescricao("");
      setAtivo("");
      setChamado("");
      setChamadoCache(null);
      setOsFornecedor("");
      setCusto("");
      setGarantia("");
      qc.invalidateQueries({ queryKey: ["atividades"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao abrir a OS");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="label-mono">Módulo 3.4</p>
          <h1 className="mt-1 text-2xl font-bold">Atividades e ordens de serviço</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Abertura → acionamento do fornecedor → check-in → evidência antes/depois → check-out →
            fechamento.
          </p>
        </div>
        <Button onClick={() => setAberto((v) => !v)}>
          <Plus className="size-4" /> {aberto ? "Fechar" : "Abrir OS"}
        </Button>
      </header>

      {aberto ? (
        <section className="panel space-y-4 p-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={tipo} onValueChange={(v) => setTipo(v as Tipo)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ATIVIDADE_TIPO_LABEL).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Título</Label>
              <Input
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Troca de nobreak do Rack 3"
              />
            </div>
            <div className="space-y-2">
              <Label>Ativo / equipamento afetado</Label>
              <Input value={ativo} onChange={(e) => setAtivo(e.target.value)} placeholder="UPS-03" />
            </div>
            <div className="space-y-2">
              <Label>Criticidade</Label>
              <Select value={criticidade} onValueChange={(v) => setCriticidade(v as Criticidade)}>
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
            <div className="space-y-2">
              <Label>Fornecedor responsável</Label>
              <Select value={fornecedorId} onValueChange={setFornecedorId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar" />
                </SelectTrigger>
                <SelectContent>
                  {fornecedores.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.razao_social}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Janela — início</Label>
              <Input type="datetime-local" value={inicio} onChange={(e) => setInicio(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Janela — fim</Label>
              <Input type="datetime-local" value={fim} onChange={(e) => setFim(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Nº da OS do fornecedor</Label>
              <Input
                value={osFornecedor}
                onChange={(e) => setOsFornecedor(e.target.value)}
                placeholder="OS-2026-1187"
              />
            </div>
            <div className="space-y-2">
              <Label>Custo estimado (R$)</Label>
              <Input
                type="number"
                step="0.01"
                min={0}
                value={custo}
                onChange={(e) => setCusto(e.target.value)}
                placeholder="0,00"
              />
            </div>
            <div className="space-y-2">
              <Label>Garantia da peça até</Label>
              <Input type="date" value={garantia} onChange={(e) => setGarantia(e.target.value)} />
            </div>
          </div>
          <ChamadoItsmField
            numero={chamado}
            onNumero={setChamado}
            cache={chamadoCache}
            onCache={setChamadoCache}
          />
          <div className="space-y-2">
            <Label>Descrição do serviço</Label>
            <Textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} />
          </div>
          <Button onClick={abrirOS} disabled={busy}>
            {busy ? "Abrindo…" : "Abrir OS e acionar fornecedor"}
          </Button>
        </section>
      ) : null}

      <div className="panel divide-y divide-border">
        {atividades.map((a) => {
          const t = criticidadeToken(a.criticidade);
          return (
            <Link
              key={a.id}
              to="/atividades/$id"
              params={{ id: a.id }}
              className="flex flex-wrap items-center justify-between gap-3 p-4 transition-colors hover:bg-accent/40"
            >
              <div>
                <p className="font-medium">
                  OS #{a.codigo} · {a.titulo}
                </p>
                <p className="text-xs text-muted-foreground">
                  {ATIVIDADE_TIPO_LABEL[a.tipo]} · {a.ativo_afetado || "sem ativo"} · aberta{" "}
                  {fmtDateTime(a.aberta_em)}
                  {a.chamado_itsm ? ` · chamado ${a.chamado_itsm}` : ""}
                  {a.numero_os_fornecedor ? ` · OS fornecedor ${a.numero_os_fornecedor}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`rounded-md px-2 py-1 text-xs font-medium ${t.bg} ${t.fg}`}>
                  {CRITICIDADE_LABEL[a.criticidade]}
                </span>
                <Badge variant="outline">{ATIVIDADE_STATUS_LABEL[a.status]}</Badge>
              </div>
            </Link>
          );
        })}
        {atividades.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">Nenhuma atividade registrada.</p>
        ) : null}
      </div>
    </div>
  );
}
