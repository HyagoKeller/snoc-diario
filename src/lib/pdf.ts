import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { CRITICIDADE_LABEL } from "@/lib/snoc";

export type ConsolidadoPdf = {
  rondas: { total: number; nc_total: number; por_criticidade: Record<string, number>; secao_top: string };
  passagem: { total: number; no_prazo: number; escalonadas: number; pendencias_abertas: number };
  terceiros: { visitas: number; tempo_medio_min: number; checkouts_atraso: number };
  atividades: { abertas: number; fechadas: number; evidencia_completa: number };
};

/** Gera o PDF do consolidado mensal e abre o diálogo de download. */
export function gerarPdfConsolidado(periodo: string, c: ConsolidadoPdf, geradoEm: string) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });

  doc.setFontSize(16);
  doc.text("SNOC — Consolidado operacional", 40, 50);
  doc.setFontSize(10);
  doc.text("Advocacia-Geral da União · SGG · DTI — Coordenação de Segurança da Informação", 40, 68);
  doc.text(`Período de referência: ${periodo}`, 40, 84);
  doc.text(`Gerado em: ${new Date(geradoEm).toLocaleString("pt-BR")}`, 40, 100);

  const criticidades = (["baixa", "media", "alta", "critica"] as const)
    .map((k) => `${CRITICIDADE_LABEL[k]}: ${c.rondas.por_criticidade[k] ?? 0}`)
    .join(" · ");

  autoTable(doc, {
    startY: 120,
    head: [["Rondas", "Valor"]],
    body: [
      ["Rondas realizadas", String(c.rondas.total)],
      ["Não conformidades", String(c.rondas.nc_total)],
      ["Por criticidade", criticidades],
      ["Maior recorrência", c.rondas.secao_top],
    ],
    styles: { fontSize: 9 },
    headStyles: { fillColor: [30, 64, 140] },
  });

  const y = () => (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 20;

  autoTable(doc, {
    startY: y(),
    head: [["Passagem de turno", "Valor"]],
    body: [
      ["Passagens registradas", String(c.passagem.total)],
      ["Aceitas no prazo", String(c.passagem.no_prazo)],
      ["Escalonadas", String(c.passagem.escalonadas)],
      ["Pendências abertas", String(c.passagem.pendencias_abertas)],
    ],
    styles: { fontSize: 9 },
    headStyles: { fillColor: [30, 64, 140] },
  });

  autoTable(doc, {
    startY: y(),
    head: [["Acesso de terceiros", "Valor"]],
    body: [
      ["Visitas registradas", String(c.terceiros.visitas)],
      ["Permanência média (min)", String(c.terceiros.tempo_medio_min)],
      ["Check-outs em atraso", String(c.terceiros.checkouts_atraso)],
    ],
    styles: { fontSize: 9 },
    headStyles: { fillColor: [30, 64, 140] },
  });

  autoTable(doc, {
    startY: y(),
    head: [["Atividades / OS", "Valor"]],
    body: [
      ["Abertas no período", String(c.atividades.abertas)],
      ["Fechadas", String(c.atividades.fechadas)],
      ["Com evidência completa", String(c.atividades.evidencia_completa)],
    ],
    styles: { fontSize: 9 },
    headStyles: { fillColor: [30, 64, 140] },
  });

  doc.setFontSize(8);
  doc.text(
    "Documento gerado automaticamente pelo SNOC — diário de bordo operacional.",
    40,
    doc.internal.pageSize.getHeight() - 30,
  );

  doc.save(`snoc-consolidado-${periodo}.pdf`);
}
