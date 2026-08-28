CREATE TABLE public.turnos_equipe (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  turno text NOT NULL UNIQUE,
  grupo_ad text,
  coordenadores text,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.turnos_equipe TO authenticated;
GRANT ALL ON public.turnos_equipe TO service_role;
ALTER TABLE public.turnos_equipe ENABLE ROW LEVEL SECURITY;
CREATE POLICY turnos_select ON public.turnos_equipe FOR SELECT TO authenticated USING (true);
CREATE POLICY turnos_admin ON public.turnos_equipe FOR ALL TO authenticated USING (has_role(auth.uid(),'super_admin')) WITH CHECK (has_role(auth.uid(),'super_admin'));
CREATE TRIGGER trg_turnos_updated BEFORE UPDATE ON public.turnos_equipe FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.turno_membros (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  turno_id uuid NOT NULL REFERENCES public.turnos_equipe(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  papel_turno text NOT NULL DEFAULT 'tecnico',
  ordem integer NOT NULL DEFAULT 1,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (turno_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.turno_membros TO authenticated;
GRANT ALL ON public.turno_membros TO service_role;
ALTER TABLE public.turno_membros ENABLE ROW LEVEL SECURITY;
CREATE POLICY turno_membros_select ON public.turno_membros FOR SELECT TO authenticated USING (true);
CREATE POLICY turno_membros_admin ON public.turno_membros FOR ALL TO authenticated USING (has_role(auth.uid(),'super_admin')) WITH CHECK (has_role(auth.uid(),'super_admin'));

ALTER TABLE public.regras_escalonamento
  ADD COLUMN IF NOT EXISTS criticidade_minima public.criticidade,
  ADD COLUMN IF NOT EXISTS notificar_coordenadores boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS notificar_gestores boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS canal text NOT NULL DEFAULT 'email',
  ADD COLUMN IF NOT EXISTS observacao text;

INSERT INTO public.turnos_equipe (turno, grupo_ad, coordenadores)
VALUES
  ('Manhã (07h-13h)', 'AGU\SNOC-Turno-Manha', ''),
  ('Tarde (13h-19h)', 'AGU\SNOC-Turno-Tarde', ''),
  ('Noite (19h-07h)', 'AGU\SNOC-Turno-Noite', '')
ON CONFLICT (turno) DO NOTHING;