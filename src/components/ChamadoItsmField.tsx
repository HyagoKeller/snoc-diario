import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ExternalLink, Plus, Search, Ticket, X } from "lucide-react";
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

/** Lista de chamados ITSM vinculados (somente leitura). */
export function ChamadosItsmLista({
  numeros,
  cache,
}: {
  numeros?: string[] | null;
  cache?: unknown;
}) {
  const lista = numeros ?? [];
  const cs = (Array.isArray(cache) ? cache : []) as ChamadoItsm[];
  if (lista.length === 0) return null;
  return (
    <div className="space-y-2">
      {lista.map((n) => (
        <ChamadoItsmCard key={n} numero={n} cache={cs.find((c) => c.numero === n) ?? null} />
      ))}
    </div>
  );
}

/**
 * Campo para vincular vários números de chamado ao mesmo registro.
 * Cada número pode ser consultado no InvGate; o cache é guardado por chamado.
 */
export function ChamadosItsmMulti({
  numeros,
  onNumeros,
  caches,
  onCaches,
  label = "Chamados ITSM vinculados (InvGate)",
}: {
  numeros: string[];
  onNumeros: (v: string[]) => void;
  caches: ChamadoItsm[];
  onCaches: (v: ChamadoItsm[]) => void;
  label?: string;
}) {
  const buscar = useServerFn(buscarChamadoItsm);
  const [novo, setNovo] = useState("");
  const [busy, setBusy] = useState(false);

  async function adicionar() {
    const numero = novo.trim();
    if (!numero) {
      toast.error("Informe o número do chamado.");
      return;
    }
    if (numeros.includes(numero)) {
      toast.warning("Esse chamado já está vinculado.");
      return;
    }
    onNumeros([...numeros, numero]);
    setNovo("");
    setBusy(true);
    try {
      const r = await buscar({ data: { numero } });
      if (r.ok) {
        onCaches([...caches.filter((c) => c.numero !== r.chamado.numero), r.chamado]);
        toast.success(`Chamado ${r.chamado.numero} vinculado.`);
      } else {
        toast.warning(`${numero}: ${r.erro}`);
      }
    } catch {
      toast.warning(`${numero} vinculado sem dados do InvGate.`);
    } finally {
      setBusy(false);
    }
  }

  function remover(numero: string) {
    onNumeros(numeros.filter((n) => n !== numero));
    onCaches(caches.filter((c) => c.numero !== numero));
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <Input
          value={novo}
          onChange={(e) => setNovo(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void adicionar();
            }
          }}
          placeholder="Ex.: 48213 — pressione Adicionar para incluir outro"
        />
        <Button type="button" variant="outline" onClick={() => void adicionar()} disabled={busy}>
          <Plus className="size-4" /> Adicionar
        </Button>
      </div>
      {numeros.length > 0 ? (
        <div className="flex flex-wrap gap-2 pt-1">
          {numeros.map((n) => {
            const c = caches.find((x) => x.numero === n);
            return (
              <span
                key={n}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 px-3 py-1 text-xs"
              >
                <Ticket className="size-3 text-primary" />
                {n}
                {c?.status ? <span className="text-muted-foreground">· {c.status}</span> : null}
                <button
                  type="button"
                  aria-label={`Remover chamado ${n}`}
                  onClick={() => remover(n)}
                  className="text-muted-foreground hover:text-critico"
                >
                  <X className="size-3" />
                </button>
              </span>
            );
          })}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          Nenhum chamado adicional vinculado. Use este campo quando o registro atender a mais de um
          chamado.
        </p>
      )}
    </div>
  );
}
