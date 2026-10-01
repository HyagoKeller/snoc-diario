ALTER TABLE public.atividades
  ADD COLUMN IF NOT EXISTS patrimonio_serial TEXT;

ALTER TABLE public.visitas
  ADD COLUMN IF NOT EXISTS modalidade TEXT NOT NULL DEFAULT 'individual';

ALTER TABLE public.visitas
  ADD CONSTRAINT visitas_modalidade_valida
  CHECK (modalidade IN ('individual', 'grupo'));