export function validarSaida(assinatura: File | undefined): string | null {
  return assinatura && assinatura.size > 0 && assinatura.type === "image/png"
    ? null
    : "A assinatura do visitante é obrigatória para registrar a saída.";
}

export function validarEntrada(nome: string, documento: string, acompanhante: string, consentimento: boolean): string | null {
  if (!nome.trim()) return "Informe o nome do visitante ou líder do grupo.";
  if (!documento.trim()) return "Informe o documento do visitante ou líder do grupo.";
  if (!acompanhante) return "Selecione o acompanhante do SNOC.";
  if (!consentimento) return "Confirme o consentimento de tratamento de dados (LGPD).";
  return null;
}