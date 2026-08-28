ALTER TABLE public.rondas
  ADD COLUMN IF NOT EXISTS chamados_itsm text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS chamados_itsm_cache jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.atividades
  ADD COLUMN IF NOT EXISTS chamados_itsm text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS chamados_itsm_cache jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.passagens_turno
  ADD COLUMN IF NOT EXISTS chamados_itsm text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS chamados_itsm_cache jsonb NOT NULL DEFAULT '[]'::jsonb;

CREATE TABLE IF NOT EXISTS public.arquivos_externos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entidade text NOT NULL,
  entidade_id uuid,
  destino text NOT NULL DEFAULT 'sharepoint',
  pasta text NOT NULL,
  nome_arquivo text NOT NULL,
  web_url text,
  tamanho_bytes bigint,
  enviado_por uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.arquivos_externos TO authenticated;
GRANT ALL ON public.arquivos_externos TO service_role;

ALTER TABLE public.arquivos_externos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "arquivos_externos_select" ON public.arquivos_externos
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "arquivos_externos_insert" ON public.arquivos_externos
  FOR INSERT TO authenticated WITH CHECK (enviado_por = auth.uid());

CREATE POLICY "arquivos_externos_delete" ON public.arquivos_externos
  FOR DELETE TO authenticated USING (public.is_manager(auth.uid()));

CREATE TRIGGER trg_arquivos_externos_updated BEFORE UPDATE ON public.arquivos_externos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();