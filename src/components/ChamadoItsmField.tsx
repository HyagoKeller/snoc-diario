import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ExternalLink, Search, Ticket } from "lucide-react";
import { toast } from "sonner";
import { buscarChamadoItsm, type ChamadoItsm } from "@/lib/invgate.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { fmtDateTime } from "@/lib/snoc";

/** Cartão somente leitura com o cache do chamado ITSM já vinculado. */
export function ChamadoItsmCard({ numero, cache }: { numero?: string | null; cache?: unknown }) {
  const c = (cache ?? null) as ChamadoItsm | null;
  if (!numero) return null;
  return (
    <div className="rounded-md border border-border bg-surface/60 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <Ticket className="size-4 text-primary" />
        <span className="text-sm font-medium">Chamado ITSM {numero}</span>
        {c?.status ? <Badge variant="outline">{c.status}</Badge> : null}
        {c?.prioridade ? <Badge variant="secondary">{c.prioridade}</Badge> : null}
        {c?.url ? (
          <a
            href={c.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs text-primary underline"
          >
            Abrir no InvGate <ExternalLink className="size-3" />
          </a>
        ) : null}
      </div>
      {c ? (
        <p className="mt-2 text-xs text-muted-foreground">
          {c.titulo || "sem título"}
          {c.categoria ? ` · ${c.categoria}` : ""}
          {c.solicitante ? ` · solicitante ${c.solicitante}` : ""}
          {c.consultado_em ? ` · consultado ${fmtDateTime(c.consultado_em)}` : ""}
        </p>
      ) : (
        <p className="mt-2 text-xs text-muted-foreground">
          Número registrado sem dados sincronizados do InvGate.
        </p>
      )}
    </div>
  );
}

/** Campo de número de chamado com busca no InvGate e cache do resultado. */
export function ChamadoItsmField({
  numero,
  onNumero,
  cache,
  onCache,
  label = "Chamado ITSM (InvGate)",
}: {
  numero: string;
  onNumero: (v: string) => void;
  cache: ChamadoItsm | null;
  onCache: (v: ChamadoItsm | null) => void;
  label?: string;
}) {
  const buscar = useServerFn(buscarChamadoItsm);
  const [busy, setBusy] = useState(false);

  async function consultar() {
    if (!numero.trim()) {
      toast.error("Informe o número do chamado.");
      return;
    }
    setBusy(true);
    try {
      const r = await buscar({ data: { numero: numero.trim() } });
      if (r.ok) {
        onCache(r.chamado);
        toast.success(`Chamado ${r.chamado.numero} vinculado.`);
      } else {
        onCache(null);
        toast.warning(r.erro);
      }
    } catch {
      onCache(null);
      toast.error("Falha ao consultar o InvGate.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <Input
          value={numero}
          onChange={(e) => {
            onNumero(e.target.value);
            onCache(null);
          }}
          placeholder="Ex.: 48213"
        />
        <Button type="button" variant="outline" onClick={consultar} disabled={busy}>
          <Search className="size-4" /> {busy ? "Buscando…" : "Buscar"}
        </Button>
      </div>
      {cache ? <ChamadoItsmCard numero={cache.numero} cache={cache} /> : null}
    </div>
  );
}
