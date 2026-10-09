import type { Tables, Json } from "@/integrations/supabase/types";
import { fmtDateTime } from "@/lib/snoc";
import { ChamadosItsmLista } from "@/components/ChamadoItsmField";

const FIELD_LABELS: Record<string, string> = {
  unidade: "Unidade / sede", empresa: "Empresa / órgão", telefone: "Telefone", email: "E-mail", cargo: "Cargo / função",
  cracha: "Crachá temporário", validade: "Validade do crachá", entrada_prevista: "Entrada prevista", saida_prevista: "Saída prevista",
  autorizado_por: "Autorizado por", tipo: "Tipo da visita", criticidade: "Criticidade", observacoes: "Ocorrências e observações",
  verificacao_0: "Identidade conferida e autorização validada", verificacao_1: "Regras de acesso e restrições informadas",
  verificacao_2: "Acompanhamento contínuo previsto", verificacao_3: "Registro de imagens autorizado",
};
function object(value: Json | undefined): Record<string, Json | undefined> {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}
function text(value: Json | undefined): string { return typeof value === "string" || typeof value === "number" ? String(value) : "—"; }

export function VisitRecord({ visit, signatureUrl, photoUrl, loading, failed, acompanhante, fornecedor, atividade, registradoPor, checkoutPor }: {
  visit: Tables<"visitas">; signatureUrl: string | null; photoUrl: string | null; loading: boolean; failed: boolean;
  acompanhante: string; fornecedor: string; atividade: string; registradoPor: string; checkoutPor: string;
}) {
  const ficha = object(visit.ficha_registro);
  const campos = object(ficha['campos']);
  const equipment = Array.isArray(ficha['equipamentos']) ? ficha['equipamentos'] : [];
  const details = [
    [visit.modalidade === "grupo" ? "Líder da excursão" : "Visitante", visit.pessoa_nome],
    ["Modalidade", visit.modalidade === "grupo" ? "Em grupo" : "Individual"],
    ["Documento", `${visit.tipo_documento ?? ""} ${visit.documento ?? "—"}`], ["Zona de acesso", visit.zona],
    ["Motivo da visita", visit.motivo_visita], ["Fornecedor", fornecedor], ["Atividade / OS", atividade],
    ["Acompanhante interno", acompanhante], ["Entrada", fmtDateTime(visit.checkin_em)], ["Saída", fmtDateTime(visit.checkout_em)],
    ["Duração prevista", `${visit.duracao_prevista_min ?? "—"} min`], ["Consentimento LGPD", visit.consentimento_lgpd ? "Sim" : "Não"],
    ["Entrada registrada por", registradoPor], ["Saída registrada por", checkoutPor],
  ];
  return <div className="space-y-6 text-sm">
    <dl className="grid gap-4 sm:grid-cols-2">{details.map(([label, value]) => <div key={label} className="min-w-0"><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1 break-words font-medium">{value || "—"}</dd></div>)}</dl>
    <section className="space-y-4 border-t border-border pt-4"><h3 className="font-semibold">Ficha de registro</h3><dl className="grid gap-4 sm:grid-cols-2">{Object.entries(FIELD_LABELS).map(([key, label]) => <div key={key} className="min-w-0"><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1 whitespace-pre-wrap break-words">{text(campos[key])}</dd></div>)}</dl></section>
    <section className="space-y-3 border-t border-border pt-4"><h3 className="font-semibold">Objetos, ferramentas e equipamentos</h3>
      {equipment.length ? equipment.map((item, i) => { const row = object(item); return <dl key={i} className="grid gap-3 border-b border-border pb-3 sm:grid-cols-2">{([ ["descricao", "Descrição"], ["modelo", "Marca / modelo"], ["serial", "Serial / patrimônio"], ["quantidade", "Quantidade"] ] as const).map(([key, label]) => <div key={key}><dt className="text-xs text-muted-foreground">{label}</dt><dd className="break-words">{text(row[key])}</dd></div>)}</dl>; }) : <p className="text-muted-foreground">Nenhum item registrado.</p>}
    </section>
    <section className="space-y-3 border-t border-border pt-4"><h3 className="font-semibold">Chamados ITSM</h3><ChamadosItsmLista numeros={visit.chamados_itsm} cache={visit.chamados_itsm_cache} />{!visit.chamados_itsm.length ? <p className="text-muted-foreground">Nenhum chamado vinculado.</p> : null}</section>
    {photoUrl ? <section className="space-y-3 border-t border-border pt-4"><h3 className="font-semibold">Documento / crachá</h3><img src={photoUrl} alt="Documento registrado na entrada" className="max-h-72 max-w-full rounded-md object-contain" /></section> : null}
    <section className="space-y-3 border-t border-border pt-4"><h3 className="font-semibold">Assinatura de saída</h3>
      {loading ? <p role="status">Carregando evidências…</p> : null}
      {failed ? <p role="alert" className="text-destructive">Não foi possível carregar uma das evidências. Feche e abra a ficha para tentar novamente.</p> : null}
      {signatureUrl ? <><p className="text-muted-foreground">Declaro encerrada minha visita e confirmo a devolução dos crachás, chaves ou cartões recebidos.</p><img src={signatureUrl} alt="Assinatura de saída do visitante" className="max-h-64 w-full rounded-md border border-border object-contain" /><p>{visit.pessoa_nome} · {fmtDateTime(visit.checkout_em)}</p></> : !loading ? <p className="text-muted-foreground">{visit.checkout_em ? "Sem assinatura no registro histórico." : "Visita em andamento — saída ainda não assinada."}</p> : null}
    </section>
  </div>;
}