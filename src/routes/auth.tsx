import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Entrar | SNOC" },
      { name: "description", content: "Acesso dos operadores e gestores do SNOC ao sistema." },
      { property: "og:title", content: "Entrar no SNOC" },
      { property: "og:description", content: "Acesso institucional Microsoft 365 ao SNOC." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  beforeLoad: () => {
    throw redirect({ to: "/" });
  },
  component: () => null,
});
