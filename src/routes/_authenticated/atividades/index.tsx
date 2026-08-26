import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { dispararNotificacao, registrarAuditoria } from "@/lib/notificacoes";
import {
  ATIVIDADE_STATUS_LABEL,
  ATIVIDADE_TIPO_LABEL,
  CRITICIDADE_LABEL,
  criticidadeToken,
  fmtDateTime,
  type Criticidade,
} from "@/lib/snoc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/atividades/")({
  head: () => ({
    meta: [
      { title: "Atividades e ordens de serviço | SNOC OPS" },
      {
        name: "description",
        content: "Abertura de OS com acionamento do fornecedor, evidência antes/depois e fechamento rastreável.",
      },
      { property: "og:title", content: "Atividades e OS do SNOC" },
      { property: "og:description", content: "Ciclo completo de troca de peça com evidência fotográfica." },
    ],
  }),
  component: Atividades;
});

function Atividades() {
  return null;
}
