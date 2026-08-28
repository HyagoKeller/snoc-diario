import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CRITICIDADE_LABEL, criticidadeToken, fmtDate } from "@/lib/snoc";

export const Route = createFileRoute("/_authenticated/rondas/")({
  head: () => ({
    meta: [
      { title: "Rondas operacionais | SNOC" },
      {
        name: "description",
        content: "Histórico de rondas do Data Center com não conformidades, criticidade e evidência fotográfica.",
      },
      { property: "og:title", content: "Rondas operacionais do SNOC" },
      { property: "og:description", content: "Checklist digital por seção com evidência fotográfica." },
    ],
  }),
  component: Rondas,
});

function Rondas() {
  const { data: rondas = [] } = useQuery({
    queryKey: ["rondas"],
    queryFn: async () => {
      const { data } = await supabase
        .from("rondas")
        .select("*")
        .order("data", { ascending: false })
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="label-mono">Módulo 3.1</p>
          <h1 className="mt-1 text-2xl font-bold">Rondas operacionais</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Checklist por seção, foto obrigatória em não conformidade e resumo calculado pelo sistema.
          </p>
        </div>
        <Button asChild>
          <Link to="/rondas/nova">
            <Plus className="size-4" /> Nova ronda
          </Link>
        </Button>
      </header>

      <div className="panel divide-y divide-border">
        {rondas.map((r) => {
          const t = criticidadeToken(r.resultado_geral);
          return (
            <Link
              key={r.id}
              to="/rondas/$id"
              params={{ id: r.id }}
              className="flex flex-wrap items-center justify-between gap-3 p-4 transition-colors hover:bg-accent/40"
            >
              <div>
                <p className="font-medium">
                  {fmtDate(r.data)} · {r.turno}
                </p>
                <p className="text-xs text-muted-foreground">
                  {r.localidade} · {r.temperatura ?? "—"} °C · {r.umidade ?? "—"}% UR
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{r.total_nc} NC</Badge>
                <span className={`rounded-md px-2 py-1 text-xs font-medium ${t.bg} ${t.fg}`}>
                  {CRITICIDADE_LABEL[r.resultado_geral]}
                </span>
                <Badge variant={r.finalizada ? "secondary" : "outline"}>
                  {r.finalizada ? "Finalizada" : "Rascunho"}
                </Badge>
              </div>
            </Link>
          );
        })}
        {rondas.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">
            Nenhuma ronda registrada. Comece pela primeira ronda do turno.
          </p>
        ) : null}
      </div>
    </div>
  );
}
