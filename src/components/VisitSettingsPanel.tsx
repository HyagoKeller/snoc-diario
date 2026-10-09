import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_VISIT_SETTINGS, parseVisitSettings } from "@/lib/operational-settings";
import { registrarAuditoria } from "@/lib/notificacoes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function useVisitSettings() {
  return useQuery({
    queryKey: ["visit-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("integracoes_config").select("valor").eq("chave", "visitas_ui_json").maybeSingle();
      if (error) throw error;
      return parseVisitSettings(data?.valor);
    },
  });
}

export function VisitSettingsPanel() {
  const { data, isLoading, error } = useVisitSettings();
  const [settings, setSettings] = useState(DEFAULT_VISIT_SETTINGS);
  const [lists, setLists] = useState({ zonas: DEFAULT_VISIT_SETTINGS.zonas.join("\n"), documentos: DEFAULT_VISIT_SETTINGS.documentos.join("\n"), tipos: DEFAULT_VISIT_SETTINGS.tipos.join("\n") });
  const [busy, setBusy] = useState(false);
  const qc = useQueryClient();
  useEffect(() => {
    if (!data) return;
    setSettings(data);
    setLists({ zonas: data.zonas.join("\n"), documentos: data.documentos.join("\n"), tipos: data.tipos.join("\n") });
  }, [data]);
  async function save() {
    const cleaned = Object.fromEntries(Object.entries(lists).map(([key, value]) => [key, [...new Set(value.split("\n").map((s) => s.trim()).filter(Boolean))]]));
    if (Object.values(cleaned).some((v) => !v.length)) { toast.error("Informe pelo menos uma opção em cada lista."); return; }
    if ([settings.checkin, settings.checkout, settings.consultar].some((s) => !s.trim())) { toast.error("Informe o nome de cada botão."); return; }
    setBusy(true);
    try {
      const { error } = await supabase.from("integracoes_config").upsert({ chave: "visitas_ui_json", valor: JSON.stringify({ ...settings, ...cleaned }) }, { onConflict: "chave" });
      if (error) throw error;
      await registrarAuditoria("personalizar_visitas", "integracoes_config", null, { chave: "visitas_ui_json" });
      await qc.invalidateQueries({ queryKey: ["visit-settings"] });
      toast.success("Opções de visitas salvas.");
    } catch { toast.error("Não foi possível salvar as opções de visitas."); }
    finally { setBusy(false); }
  }
  return <section className="space-y-5 py-2">
    <h2 className="text-base font-semibold">Opções do formulário de visitas</h2>
    {error ? <p role="alert" className="text-sm text-destructive">Não foi possível carregar as configurações.</p> : null}
    <div className="grid gap-5 md:grid-cols-3">
      {([ ["zonas", "Zonas de acesso"], ["documentos", "Tipos de documento"], ["tipos", "Tipos de visita"] ] as const).map(([key, label]) => <div key={key} className="space-y-2"><Label htmlFor={`config-${key}`}>{label} (uma por linha)</Label><Textarea id={`config-${key}`} rows={6} value={lists[key]} onChange={(e) => setLists({ ...lists, [key]: e.target.value })} /></div>)}
    </div>
    <h3 className="font-semibold">Nomes dos botões</h3>
    <div className="grid gap-5 md:grid-cols-3">
      {([ ["checkin", "Entrada"], ["checkout", "Saída"], ["consultar", "Consulta da ficha"] ] as const).map(([key, label]) => <div key={key} className="space-y-2"><Label htmlFor={`config-${key}`}>{label}</Label><Input id={`config-${key}`} maxLength={40} value={settings[key]} onChange={(e) => setSettings({ ...settings, [key]: e.target.value })} /></div>)}
    </div>
    <Button disabled={busy || isLoading || Boolean(error)} onClick={() => void save()}>{busy ? "Salvando…" : "Salvar personalização"}</Button>
  </section>;
}