ALTER TABLE public.rondas
  ADD COLUMN IF NOT EXISTS chamado_itsm TEXT,
  ADD COLUMN IF NOT EXISTS chamado_itsm_cache JSONB,
  ADD COLUMN IF NOT EXISTS ronda_anterior_id UUID REFERENCES public.rondas(id) ON DELETE SET NULL;

ALTER TABLE public.atividades
  ADD COLUMN IF NOT EXISTS chamado_itsm TEXT,
  ADD COLUMN IF NOT EXISTS chamado_itsm_cache JSONB,
  ADD COLUMN IF NOT EXISTS numero_os_fornecedor TEXT,
  ADD COLUMN IF NOT EXISTS custo NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS garantia_ate DATE,
  ADD COLUMN IF NOT EXISTS nota_fiscal_url TEXT;

ALTER TABLE public.fornecedores
  ADD COLUMN IF NOT EXISTS cnpj TEXT,
  ADD COLUMN IF NOT EXISTS apolice_seguro TEXT,
  ADD COLUMN IF NOT EXISTS seguro_validade DATE,
  ADD COLUMN IF NOT EXISTS avaliacao_media NUMERIC(3,2) DEFAULT NULL;

ALTER TABLE public.visitas
  ADD COLUMN IF NOT EXISTS tipo_documento TEXT,
  ADD COLUMN IF NOT EXISTS placa_veiculo TEXT,
  ADD COLUMN IF NOT EXISTS motivo_visita TEXT;

ALTER TABLE public.passagens_turno
  ADD COLUMN IF NOT EXISTS status_servicos_tier0 TEXT,
  ADD COLUMN IF NOT EXISTS contingencia_ativa BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS contingencia_descricao TEXT;

ALTER TABLE public.atividade_evidencias
  ADD COLUMN IF NOT EXISTS aprovado_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS aprovado_em TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS public.integracoes_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chave TEXT UNIQUE NOT NULL,
  valor TEXT NOT NULL,
  atualizado_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.integracoes_config TO authenticated;
GRANT ALL ON public.integracoes_config TO service_role;

ALTER TABLE public.integracoes_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "integracoes_select" ON public.integracoes_config
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "integracoes_insert" ON public.integracoes_config
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'::public.app_role));

CREATE POLICY "integracoes_update" ON public.integracoes_config
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'::public.app_role));

CREATE TRIGGER trg_integracoes_updated BEFORE UPDATE ON public.integracoes_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.integracoes_config (chave, valor)
VALUES ('invgate_base_url', 'https://agu-staging.sd.cloud.invgate.net')
ON CONFLICT (chave) DO NOTHING;