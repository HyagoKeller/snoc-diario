import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type EquipamentoVisita = { descricao: string; modelo: string; serial: string; quantidade: string };
export type FichaVisita = { campos: Record<string, string>; equipamentos: EquipamentoVisita[] };
export const novaFicha = (): FichaVisita => ({ campos: {}, equipamentos: [] });

export function VisitaFichaFields({ value, onChange }: { value: FichaVisita; onChange: (value: FichaVisita) => void }) {
  function campo(key: string, content: string) { onChange({ ...value, campos: { ...value.campos, [key]: content } }); }
  const campos = [
    ["unidade", "Unidade / sede", "text"], ["empresa", "Empresa / órgão", "text"],
    ["telefone", "Telefone", "tel"], ["email", "E-mail", "email"], ["cargo", "Cargo / função", "text"],
    ["cracha", "Crachá temporário", "text"], ["validade", "Validade do crachá", "date"],
    ["entrada_prevista", "Entrada prevista", "datetime-local"], ["saida_prevista", "Saída prevista", "datetime-local"],
    ["autorizado_por", "Autorizado por", "text"],
  ];
  return <div className="space-y-5 border-t border-border pt-5">
    <h2 className="font-semibold">Ficha de registro da visita</h2>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {campos.map(([key = "", label = "", type = "text"]) => <div key={key} className="space-y-2"><Label htmlFor={`ficha-${key}`}>{label}</Label><Input id={`ficha-${key}`} type={type} value={value.campos[key] ?? ""} onChange={(e) => campo(key, e.target.value)} className="min-h-11" /></div>)}
      {[
        { key: "tipo", label: "Tipo da visita", options: ["Visita", "Auditoria", "Fornecedor", "Manutenção"] },
        { key: "criticidade", label: "Criticidade", options: ["Normal", "Emergencial"] },
      ].map(({ key, label, options }) => <div key={key} className="space-y-2"><Label>{label}</Label><Select value={value.campos[key] ?? options[0]} onValueChange={(v) => campo(key, v)}><SelectTrigger className="min-h-11"><SelectValue /></SelectTrigger><SelectContent>{options.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select></div>)}
    </div>
    <div className="grid gap-4 sm:grid-cols-2">
      {["Identidade conferida e autorização validada", "Regras de acesso e restrições informadas", "Acompanhamento contínuo previsto", "Registro de imagens autorizado"].map((label, i) => <div key={label} className="space-y-2"><Label>{label}</Label><Select value={value.campos[`verificacao_${i}`] ?? ""} onValueChange={(v) => campo(`verificacao_${i}`, v)}><SelectTrigger className="min-h-11"><SelectValue placeholder="Selecionar" /></SelectTrigger><SelectContent>{["Sim", "Não", "Não se aplica"].map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select></div>)}
    </div>
    <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="font-semibold">Objetos, ferramentas e equipamentos</h3><Button type="button" variant="outline" className="min-h-11" onClick={() => onChange({ ...value, equipamentos: [...value.equipamentos, { descricao: "", modelo: "", serial: "", quantidade: "1" }] })}><Plus className="size-4" /> Adicionar item</Button></div>
    {value.equipamentos.map((item, index) => <div key={index} className="grid gap-3 border-b border-border pb-4 sm:grid-cols-2 lg:grid-cols-5">
      {([ ["descricao", "Descrição"], ["modelo", "Marca / modelo"], ["serial", "Serial / patrimônio"], ["quantidade", "Quantidade"] ] as const).map(([key, label]) => <div key={key} className="space-y-2"><Label htmlFor={`item-${index}-${key}`}>{label}</Label><Input id={`item-${index}-${key}`} type={key === "quantidade" ? "number" : "text"} min={1} value={item[key]} onChange={(e) => onChange({ ...value, equipamentos: value.equipamentos.map((current, i) => i === index ? { ...current, [key]: e.target.value } : current) })} className="min-h-11" /></div>)}
      <Button type="button" variant="ghost" className="self-end min-h-11" aria-label={`Remover item ${index + 1}`} onClick={() => onChange({ ...value, equipamentos: value.equipamentos.filter((_, i) => i !== index) })}><Trash2 className="size-4" /></Button>
    </div>)}
    <div className="space-y-2"><Label htmlFor="ficha-observacoes">Ocorrências e observações</Label><Textarea id="ficha-observacoes" value={value.campos.observacoes ?? ""} onChange={(e) => campo("observacoes", e.target.value)} /></div>
  </div>;
}