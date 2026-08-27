import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { registrarAuditoria } from "@/lib/notificacoes";
import { ROLE_LABEL, fmtDateTime, type AppRole } from "@/lib/snoc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Administração | SNOC OPS" },
      {
        name: "description",
        content: "Papéis de usuário, regras de escalonamento, disparos registrados e log de auditoria.",
      },
      { property: "og:title", content: "Administração do SNOC OPS" },
      { property: "og:description", content: "Configuração de papéis, notificações e auditoria." },
    ],
  }),
  component: Admin,
});

const EVENTOS = [
  { valor: "ronda_nc_critica", label: "Ronda com NC crítica" },
  { valor: "passagem_sem_aceite", label: "Passagem de turno sem aceite no prazo" },
  { valor: "abertura_os", label: "Abertura de atividade / OS" },
  { valor: "checkout_atrasado", label: "Prestador sem check-out no prazo" },
  { valor: "relatorio_mensal", label: "Relatório mensal consolidado" },
];

function Admin() {
  const { isAdmin } = useAuth();
  const qc = useQueryClient();
  const [evento, setEvento] = useState(EVENTOS[0]!.valor);
  const [prazo, setPrazo] = useState("15");
  const [nivel, setNivel] = useState("1");
  const [destinatarios, setDestinatarios] = useState("");
  const [baseUrl, setBaseUrl] = useState("");

  const { data } = useQuery({
    queryKey: ["admin"],
    queryFn: async () => {
      const [
        { data: perfis },
        { data: papeis },
        { data: regras },
        { data: notifs },
        { data: aud },
        { data: integ },
      ] = await Promise.all([
        supabase.from("profiles").select("*").order("nome"),
        supabase.from("user_roles").select("*"),
        supabase.from("regras_escalonamento").select("*").order("evento").order("nivel"),
        supabase.from("notificacoes").select("*").order("enviado_em", { ascending: false }).limit(100),
        supabase.from("auditoria").select("*").order("created_at", { ascending: false }).limit(100),
        supabase.from("integracoes_config").select("*").eq("chave", "invgate_base_url").maybeSingle(),
      ]);
      return {
        perfis: perfis ?? [],
        papeis: papeis ?? [],
        regras: regras ?? [],
        notifs: notifs ?? [],
        auditoria: aud ?? [],
        integracoes: integ ?? null,
      };
    },
  });

  const perfis = data?.perfis ?? [];
  const papeis = data?.papeis ?? [];

  useEffect(() => {
    if (data?.integracoes) setBaseUrl(data.integracoes.valor);
  }, [data?.integracoes]);

  async function salvarIntegracao() {
    const valor = baseUrl.trim().replace(/\/+$/, "");
    if (!valor) {
      toast.error("Informe a URL base do InvGate.");
      return;
    }
    const { error } = await supabase
      .from("integracoes_config")
      .update({ valor })
      .eq("chave", "invgate_base_url");
    if (error) {
      toast.error(error.message);
      return;
    }
    await registrarAuditoria("atualizar_integracao", "integracoes_config", null, {
      chave: "invgate_base_url",
    });
    toast.success("Integração atualizada");
    qc.invalidateQueries({ queryKey: ["admin"] });
  }

  async function definirPapel(userId: string, role: AppRole) {
    const atuais = papeis.filter((p) => p.user_id === userId);
    for (const a of atuais) await supabase.from("user_roles").delete().eq("id", a.id);
    const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
    if (error) {
      toast.error(error.message);
      return;
    }
    await registrarAuditoria("definir_papel", "user_roles", userId, { role });
    toast.success(`Papel atualizado para ${ROLE_LABEL[role]}`);
    qc.invalidateQueries({ queryKey: ["admin"] });
  }

  async function criarRegra() {
    if (!destinatarios.trim()) {
      toast.error("Informe ao menos um e-mail de destinatário.");
      return;
    }
    const { error } = await supabase.from("regras_escalonamento").insert({
      evento,
      prazo_minutos: Number(prazo || 15),
      nivel: Number(nivel || 1),
      destinatarios,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    setDestinatarios("");
    toast.success("Regra cadastrada");
    qc.invalidateQueries({ queryKey: ["admin"] });
  }

  async function removerRegra(id: string) {
    const { error } = await supabase.from("regras_escalonamento").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Regra removida");
    qc.invalidateQueries({ queryKey: ["admin"] });
  }

  async function alternarAtivo(id: string, ativo: boolean) {
    await supabase.from("profiles").update({ ativo: !ativo }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin"] });
  }

  if (!isAdmin) {
    return <p className="panel p-6 text-sm text-muted-foreground">Área restrita ao Super Admin.</p>;
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="label-mono">Módulos 2 e 3.6</p>
        <h1 className="mt-1 text-2xl font-bold">Administração</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Papéis, regras de notificação e escalonamento, disparos registrados e auditoria.
        </p>
      </header>

      <Tabs defaultValue="usuarios">
        <TabsList>
          <TabsTrigger value="usuarios">Usuários e papéis</TabsTrigger>
          <TabsTrigger value="regras">Notificações</TabsTrigger>
          <TabsTrigger value="disparos">Disparos</TabsTrigger>
          <TabsTrigger value="auditoria">Auditoria</TabsTrigger>
          <TabsTrigger value="integracoes">Integrações</TabsTrigger>
        </TabsList>

        <TabsContent value="usuarios" className="pt-4">
          <div className="panel divide-y divide-border">
            {perfis.map((p) => {
              const papel = papeis.find((x) => x.user_id === p.id)?.role as AppRole | undefined;
              return (
                <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div>
                    <p className="font-medium">{p.nome || p.email}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.email} {p.grupo_ad ? `· grupo AD: ${p.grupo_ad}` : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={p.ativo ? "secondary" : "outline"}>
                      {p.ativo ? "Ativo" : "Inativo"}
                    </Badge>
                    <Select
                      value={papel ?? "operador"}
                      onValueChange={(v) => definirPapel(p.id, v as AppRole)}
                    >
                      <SelectTrigger className="w-44">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(["operador", "gestor", "super_admin"] as AppRole[]).map((r) => (
                          <SelectItem key={r} value={r}>
                            {ROLE_LABEL[r]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm" onClick={() => alternarAtivo(p.id, p.ativo)}>
                      {p.ativo ? "Desativar" : "Ativar"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            O campo “grupo AD” prepara o mapeamento automático de papéis quando o login federado
            (Entra ID) for habilitado: cada grupo do AD passa a definir o papel, sem manutenção
            manual.
          </p>
        </TabsContent>

        <TabsContent value="regras" className="space-y-4 pt-4">
          <section className="panel space-y-4 p-5">
            <h2 className="text-base font-semibold">Nova regra</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label>Evento</Label>
                <Select value={evento} onValueChange={setEvento}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EVENTOS.map((e) => (
                      <SelectItem key={e.valor} value={e.valor}>
                        {e.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Prazo (minutos)</Label>
                <Input type="number" value={prazo} onChange={(e) => setPrazo(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Nível de escalonamento</Label>
                <Input type="number" min={1} value={nivel} onChange={(e) => setNivel(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Destinatários (separados por vírgula)</Label>
                <Input
                  value={destinatarios}
                  onChange={(e) => setDestinatarios(e.target.value)}
                  placeholder="chefia@agu.gov.br, gestor@agu.gov.br"
                />
              </div>
            </div>
            <Button onClick={criarRegra}>
              <Plus className="size-4" /> Cadastrar regra
            </Button>
          </section>

          <div className="panel divide-y divide-border">
            {(data?.regras ?? []).map((r) => (
              <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <p className="font-medium">
                    {EVENTOS.find((e) => e.valor === r.evento)?.label ?? r.evento}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Nível {r.nivel} · {r.prazo_minutos} min · {r.destinatarios}
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => removerRegra(r.id)}>
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
            {(data?.regras ?? []).length === 0 ? (
              <p className="p-6 text-sm text-muted-foreground">
                Nenhuma regra cadastrada — sem regras, os eventos ficam registrados mas não notificam
                ninguém.
              </p>
            ) : null}
          </div>
        </TabsContent>

        <TabsContent value="disparos" className="pt-4">
          <div className="panel divide-y divide-border">
            {(data?.notifs ?? []).map((n) => (
              <div key={n.id} className="p-4">
                <p className="text-sm font-medium">{n.assunto || n.regra}</p>
                <p className="text-xs text-muted-foreground">
                  {n.destinatario} · {n.canal} · {fmtDateTime(n.enviado_em)} · regra {n.regra}
                </p>
              </div>
            ))}
            {(data?.notifs ?? []).length === 0 ? (
              <p className="p-6 text-sm text-muted-foreground">Nenhum disparo registrado.</p>
            ) : null}
          </div>
        </TabsContent>

        <TabsContent value="auditoria" className="pt-4">
          <div className="panel divide-y divide-border">
            {(data?.auditoria ?? []).map((a) => (
              <div key={a.id} className="p-4 text-sm">
                <p>
                  <span className="font-medium">{a.acao}</span> em {a.entidade}
                </p>
                <p className="text-xs text-muted-foreground">
                  {perfis.find((p) => p.id === a.usuario_id)?.nome ?? a.usuario_id} ·{" "}
                  {fmtDateTime(a.created_at)}
                </p>
              </div>
            ))}
            {(data?.auditoria ?? []).length === 0 ? (
              <p className="p-6 text-sm text-muted-foreground">Sem registros de auditoria.</p>
            ) : null}
          </div>
        </TabsContent>

        <TabsContent value="integracoes" className="space-y-4 pt-4">
          <section className="panel space-y-4 p-5">
            <h2 className="text-base font-semibold">InvGate (Service Desk / ITSM)</h2>
            <p className="text-sm text-muted-foreground">
              A URL base é usada para consultar e abrir chamados vinculados a rondas e ordens de
              serviço. O token de API fica guardado como segredo do servidor e nunca aparece aqui.
            </p>
            <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
              <div className="space-y-2">
                <Label>URL base do InvGate</Label>
                <Input
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder="https://agu.sd.cloud.invgate.net"
                />
              </div>
              <Button onClick={salvarIntegracao}>Salvar</Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Atualizado {fmtDateTime(data?.integracoes?.updated_at)}.
            </p>
          </section>
        </TabsContent>
      </Tabs>
    </div>
  );
}
