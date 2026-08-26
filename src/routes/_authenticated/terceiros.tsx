import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, LogIn, LogOut, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { uploadEvidencia } from "@/lib/storage";
import { dispararNotificacao, registrarAuditoria } from "@/lib/notificacoes";
import { fmtDate, fmtDateTime, minutosEntre } from "@/lib/snoc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/terceiros")({
  head: () => ({
    meta: [
      { title: "Controle de acesso de terceiros | SNOC OPS" },
      {
        name: "description",
        content: "Check-in e check-out de fornecedores amarrado a uma OS, com foto de documento e acompanhante interno.",
      },
      { property: "og:title", content: "Acesso de terceiros no Data Center" },
      { property: "og:description", content: "Log de acesso auditável com alerta de check-out em atraso." },
    ],
  }),
  component: Terceiros,
});

function Terceiros() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const [pessoa, setPessoa] = useState("");
  const [documento, setDocumento] = useState("");
  const [fornecedorId, setFornecedorId] = useState("");
  const [atividadeId, setAtividadeId] = useState("");
  const [zona, setZona] = useState("Sala de Servidores");
  const [duracao, setDuracao] = useState("120");
  const [acompanhante, setAcompanhante] = useState("");
  const [consent, setConsent] = useState(false);
  const [fotoDoc, setFotoDoc] = useState<File | undefined>();
  const [busy, setBusy] = useState(false);

  const [fNome, setFNome] = useState("");
  const [fContato, setFContato] = useState("");
  const [fEmail, setFEmail] = useState("");
  const [fDoc, setFDoc] = useState("");
  const [fValidade, setFValidade] = useState("");
  const [fTarefas, setFTarefas] = useState("");

  const { data } = useQuery({
    queryKey: ["terceiros"],
    queryFn: async () => {
      const [{ data: visitas }, { data: fornecedores }, { data: atividades }, { data: perfis }] =
        await Promise.all([
          supabase.from("visitas").select("*").order("checkin_em", { ascending: false }),
          supabase.from("fornecedores").select("*").order("razao_social"),
          supabase.from("atividades").select("id,codigo,titulo,status").order("aberta_em", { ascending: false }),
          supabase.from("profiles").select("id,nome,email").eq("ativo", true),
        ]);
      return {
        visitas: visitas ?? [],
        fornecedores: fornecedores ?? [],
        atividades: atividades ?? [],
        perfis: perfis ?? [],
      };
    },
  });

  const visitas = data?.visitas ?? [];
  const fornecedores = data?.fornecedores ?? [];
  const atividades = data?.atividades ?? [];
  const perfis = data?.perfis ?? [];

  async function checkin() {
    if (!user) return;
    if (!pessoa.trim()) {
      toast.error("Informe o nome da pessoa.");
      return;
    }
    if (!consent) {
      toast.error("O consentimento de tratamento de dados (LGPD) é obrigatório.");
      return;
    }
    setBusy(true);
    try {
      let foto: string | null = null;
      if (fotoDoc) foto = await uploadEvidencia(fotoDoc, "visitas");
      const { data: v, error } = await supabase
        .from("visitas")
        .insert({
          pessoa_nome: pessoa,
          documento: documento || null,
          foto_documento_url: foto,
          fornecedor_id: fornecedorId || null,
          atividade_id: atividadeId || null,
          zona,
          duracao_prevista_min: Number(duracao || 120),
          acompanhante_id: acompanhante || null,
          consentimento_lgpd: consent,
          registrado_por: user.id,
        })
        .select()
        .single();
      if (error) throw error;
      if (atividadeId) {
        await supabase.from("atividades").update({ status: "em_execucao" }).eq("id", atividadeId);
      }
      await registrarAuditoria("checkin", "visitas", v.id, { pessoa });
      toast.success("Check-in registrado");
      setPessoa("");
      setDocumento("");
      setFotoDoc(undefined);
      setConsent(false);
      qc.invalidateQueries({ queryKey: ["terceiros"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha no check-in");
    } finally {
      setBusy(false);
    }
  }

  async function checkout(id: string, atividade_id: string | null) {
    const { error } = await supabase
      .from("visitas")
      .update({ checkout_em: new Date().toISOString() })
      .eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    await registrarAuditoria("checkout", "visitas", id);
    if (atividade_id) {
      await supabase
        .from("atividades")
        .update({ status: "aguardando_fechamento" })
        .eq("id", atividade_id);
      toast.info("Check-out feito. A OS vinculada aguarda confirmação de encerramento.");
    } else {
      toast.success("Check-out registrado");
    }
    qc.invalidateQueries({ queryKey: ["terceiros"] });
  }

  async function alertarAtraso(id: string, nome: string) {
    const n = await dispararNotificacao(
      "checkout_atrasado",
      "[SNOC] Prestador sem check-out no tempo previsto",
      `${nome} continua em campo além da duração prevista e não registrou check-out.`,
      { tipo: "visita", id },
    );
    toast[n ? "success" : "warning"](
      n ? `Alerta enviado a ${n} destinatário(s).` : "Sem regra cadastrada para 'checkout_atrasado'.",
    );
  }

  async function criarFornecedor() {
    if (!fNome.trim()) {
      toast.error("Informe a razão social.");
      return;
    }
    const { error } = await supabase.from("fornecedores").insert({
      razao_social: fNome,
      contato_nome: fContato || null,
      contato_email: fEmail || null,
      documento: fDoc || null,
      validade_credencial: fValidade || null,
      tarefas_autorizadas: fTarefas || null,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Fornecedor cadastrado");
    setFNome("");
    setFContato("");
    setFEmail("");
    setFDoc("");
    setFValidade("");
    setFTarefas("");
    qc.invalidateQueries({ queryKey: ["terceiros"] });
  }

  const emCampo = visitas.filter((v) => !v.checkout_em);
  const nomePerfil = (id?: string | null) => perfis.find((p) => p.id === id)?.nome ?? "—";
  const nomeForn = (id?: string | null) => fornecedores.find((f) => f.id === id)?.razao_social ?? "—";
  const osLabel = (id?: string | null) => {
    const a = atividades.find((x) => x.id === id);
    return a ? `OS #${a.codigo} — ${a.titulo}` : "—";
  };

  return (
    <div className="space-y-6">
      <header>
        <p className="label-mono">Módulo 3.3</p>
        <h1 className="mt-1 text-2xl font-bold">Controle de acesso de terceiros</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Todo acesso fica amarrado a uma atividade, com acompanhante interno e log permanente.
        </p>
      </header>

      <Tabs defaultValue="visitas">
        <TabsList>
          <TabsTrigger value="visitas">Visitas ({emCampo.length} em campo)</TabsTrigger>
          <TabsTrigger value="checkin">Novo check-in</TabsTrigger>
          <TabsTrigger value="fornecedores">Fornecedores</TabsTrigger>
        </TabsList>

        <TabsContent value="visitas" className="space-y-3 pt-4">
          {visitas.map((v) => {
            const atrasado = !v.checkout_em && minutosEntre(v.checkin_em) > (v.duracao_prevista_min ?? 120);
            return (
              <article key={v.id} className="panel p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{v.pessoa_nome}</p>
                    <p className="text-xs text-muted-foreground">
                      {nomeForn(v.fornecedor_id)} · {v.zona} · doc. {v.documento || "—"}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {osLabel(v.atividade_id)} · acompanhante {nomePerfil(v.acompanhante_id)}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Entrada {fmtDateTime(v.checkin_em)} · Saída {fmtDateTime(v.checkout_em)} ·{" "}
                      {minutosEntre(v.checkin_em, v.checkout_em)} min (previsto {v.duracao_prevista_min})
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {atrasado ? (
                      <>
                        <Badge variant="destructive">Check-out em atraso</Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => alertarAtraso(v.id, v.pessoa_nome)}
                        >
                          <AlertTriangle className="size-4" /> Notificar
                        </Button>
                      </>
                    ) : null}
                    {v.checkout_em ? (
                      <Badge variant="secondary">Encerrada</Badge>
                    ) : (
                      <Button size="sm" onClick={() => checkout(v.id, v.atividade_id)}>
                        <LogOut className="size-4" /> Check-out
                      </Button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
          {visitas.length === 0 ? (
            <p className="panel p-6 text-sm text-muted-foreground">Nenhuma visita registrada.</p>
          ) : null}
        </TabsContent>

        <TabsContent value="checkin" className="pt-4">
          <section className="panel space-y-4 p-5">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <Label>Nome da pessoa</Label>
                <Input value={pessoa} onChange={(e) => setPessoa(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Documento</Label>
                <Input value={documento} onChange={(e) => setDocumento(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Fornecedor</Label>
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
                <Label>Atividade / OS</Label>
                <Select value={atividadeId} onValueChange={setAtividadeId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar OS" />
                  </SelectTrigger>
                  <SelectContent>
                    {atividades.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        OS #{a.codigo} — {a.titulo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Zona de acesso</Label>
                <Input value={zona} onChange={(e) => setZona(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Duração prevista (min)</Label>
                <Input type="number" value={duracao} onChange={(e) => setDuracao(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Acompanhante interno</Label>
                <Select value={acompanhante} onValueChange={setAcompanhante}>
                  <SelectTrigger>
                    <SelectValue placeholder="Operador responsável" />
                  </SelectTrigger>
                  <SelectContent>
                    {perfis.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.nome || p.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="fotodoc">Foto do documento / crachá</Label>
                <Input
                  id="fotodoc"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFotoDoc(e.target.files?.[0])}
                />
              </div>
            </div>

            <label className="flex items-start gap-3 rounded-md border border-border p-3 text-sm">
              <Checkbox checked={consent} onCheckedChange={(v) => setConsent(v === true)} />
              <span className="text-muted-foreground">
                A pessoa foi informada de que nome, documento e imagem são tratados para controle de
                acesso a infraestrutura crítica, com retenção de 5 anos, e consentiu (LGPD, art. 7º).
              </span>
            </label>

            <Button onClick={checkin} disabled={busy}>
              <LogIn className="size-4" /> {busy ? "Registrando…" : "Registrar check-in"}
            </Button>
          </section>
        </TabsContent>

        <TabsContent value="fornecedores" className="space-y-4 pt-4">
          <section className="panel space-y-4 p-5">
            <h2 className="text-base font-semibold">Cadastrar fornecedor / prestador</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <Label>Razão social</Label>
                <Input value={fNome} onChange={(e) => setFNome(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Responsável técnico</Label>
                <Input value={fContato} onChange={(e) => setFContato(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>E-mail para acionamento</Label>
                <Input type="email" value={fEmail} onChange={(e) => setFEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>CNPJ / documento</Label>
                <Input value={fDoc} onChange={(e) => setFDoc(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Validade da credencial</Label>
                <Input type="date" value={fValidade} onChange={(e) => setFValidade(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Tarefas autorizadas e evidência exigida</Label>
              <Textarea value={fTarefas} onChange={(e) => setFTarefas(e.target.value)} />
            </div>
            <Button onClick={criarFornecedor}>
              <Plus className="size-4" /> Cadastrar
            </Button>
          </section>

          <div className="panel divide-y divide-border">
            {fornecedores.map((f) => (
              <div key={f.id} className="p-4">
                <p className="font-medium">{f.razao_social}</p>
                <p className="text-xs text-muted-foreground">
                  {f.contato_nome || "—"} · {f.contato_email || "sem e-mail"} · credencial até{" "}
                  {f.validade_credencial ? fmtDate(f.validade_credencial) : "—"}
                </p>
                {f.tarefas_autorizadas ? (
                  <p className="mt-2 text-sm text-muted-foreground">{f.tarefas_autorizadas}</p>
                ) : null}
              </div>
            ))}
            {fornecedores.length === 0 ? (
              <p className="p-6 text-sm text-muted-foreground">Nenhum fornecedor cadastrado.</p>
            ) : null}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
