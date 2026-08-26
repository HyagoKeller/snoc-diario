import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { signedUrl } from "@/lib/storage";
import { CRITICIDADE_LABEL, STATUS_LABEL, criticidadeToken, fmtDate } from "@/lib/snoc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/rondas/$id")({
  head: () => ({
    meta: [
      { title: "Detalhe da ronda | SNOC OPS" },
      { name: "description", content: "Itens, não conformidades e evidências fotográficas da ronda." },
      { property: "og:title", content: "Detalhe da ronda operacional" },
      { property: "og:description", content: "Registro auditável de uma ronda do Data Center." },
    ],
  }),
  component: DetalheRonda,
});

function DetalheRonda() {
  const { id } = Route.useParams();

  const { data } = useQuery({
    queryKey: ["ronda", id],
    queryFn: async () => {
      const [{ data: ronda }, { data: itens }] = await Promise.all([
        supabase.from("rondas").select("*").eq("id", id).maybeSingle(),
        supabase.from("ronda_itens").select("*").eq("ronda_id", id).order("secao"),
      ]);
      const comUrl = await Promise.all(
        (itens ?? []).map(async (i) => ({
          ...i,
          url: i.foto_url ? await signedUrl(i.foto_url) : null,
        })),
      );
      return { ronda, itens: comUrl };
    },
  });

  const ronda = data?.ronda;
  const itens = data?.itens ?? [];
  const secoes = [...new Set(itens.map((i) => i.secao))];

  if (!ronda) {
    return <p className="text-sm text-muted-foreground">Carregando ronda…</p>;
  }

  const t = criticidadeToken(ronda.resultado_geral);

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm">
        <Link to="/rondas">
          <ArrowLeft className="size-4" /> Rondas
        </Link>
      </Button>

      <header className="panel p-5">
        <p className="label-mono">{ronda.localidade}</p>
        <h1 className="mt-1 text-2xl font-bold">
          {fmtDate(ronda.data)} · {ronda.turno}
        </h1>
        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          <Badge variant="outline">{ronda.total_nc} não conformidades</Badge>
          <span className={`rounded-md px-2 py-1 text-xs font-medium ${t.bg} ${t.fg}`}>
            {CRITICIDADE_LABEL[ronda.resultado_geral]}
          </span>
          <Badge variant="secondary">{ronda.temperatura ?? "—"} °C</Badge>
          <Badge variant="secondary">{ronda.umidade ?? "—"}% UR</Badge>
        </div>
        {ronda.observacoes ? (
          <p className="mt-4 text-sm text-muted-foreground">{ronda.observacoes}</p>
        ) : null}
      </header>

      {secoes.map((secao) => (
        <section key={secao} className="panel p-5">
          <h2 className="text-base font-semibold">{secao}</h2>
          <div className="mt-4 space-y-3">
            {itens
              .filter((i) => i.secao === secao)
              .map((i) => (
                <div key={i.id} className="rounded-md border border-border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm">{i.item}</p>
                    <Badge
                      variant={i.status === "NC" ? "destructive" : "outline"}
                      className={i.status === "C" ? "text-ok" : undefined}
                    >
                      {STATUS_LABEL[i.status]}
                    </Badge>
                  </div>
                  {i.observacao ? (
                    <p className="mt-2 text-sm text-muted-foreground">{i.observacao}</p>
                  ) : null}
                  {i.url ? (
                    <img
                      src={i.url}
                      alt={`Evidência da não conformidade: ${i.item}`}
                      className="mt-3 max-h-72 rounded-md border border-border object-cover"
                      loading="lazy"
                    />
                  ) : null}
                </div>
              ))}
          </div>
        </section>
      ))}
    </div>
  );
}
