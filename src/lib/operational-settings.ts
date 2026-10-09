export const DEFAULT_VISIT_SETTINGS = {
  zonas: ["Data Center Sede 1", "Data Center Sede 3"],
  documentos: ["RG", "CNH", "CPF", "Passaporte", "Crachá corporativo"],
  tipos: ["Visita", "Auditoria", "Fornecedor", "Manutenção"],
  checkin: "Registrar check-in",
  checkout: "Assinar saída",
  consultar: "Consultar ficha",
};
export type VisitSettings = typeof DEFAULT_VISIT_SETTINGS;
export function parseVisitSettings(raw?: string): VisitSettings {
  try {
    const parsed = JSON.parse(raw ?? "{}");
    const result = { ...DEFAULT_VISIT_SETTINGS };
    for (const key of ["zonas", "documentos", "tipos"] as const) {
      if (Array.isArray(parsed[key])) {
        const values = [...new Set<string>(parsed[key].filter((v: unknown): v is string => typeof v === "string" && Boolean(v.trim())).map((v: string) => v.trim()))];
        if (values.length) result[key] = values;
      }
    }
    for (const key of ["checkin", "checkout", "consultar"] as const) {
      if (typeof parsed[key] === "string" && parsed[key].trim()) result[key] = parsed[key].trim();
    }
    return result;
  } catch { return { ...DEFAULT_VISIT_SETTINGS }; }
}