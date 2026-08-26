-- ENUMS
CREATE TYPE public.app_role AS ENUM ('operador','gestor','super_admin');
CREATE TYPE public.item_status AS ENUM ('C','NC','NA');
CREATE TYPE public.criticidade AS ENUM ('baixa','media','alta','critica');
CREATE TYPE public.aceite_status AS ENUM ('pendente','aceito','escalonado');
CREATE TYPE public.atividade_tipo AS ENUM ('preventiva','corretiva','troca_peca','instalacao');
CREATE TYPE public.atividade_status AS ENUM ('aberta','agendada','em_execucao','aguardando_fechamento','fechada','cancelada');
CREATE TYPE public.evidencia_tipo AS ENUM ('antes','depois','laudo');

-- updated_at helper
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- PROFILES
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  grupo_ad TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- USER ROLES
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.is_manager(_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('gestor','super_admin'));
$$;

CREATE POLICY "profiles_select_auth" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid() OR public.is_manager(auth.uid()));
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());

CREATE POLICY "user_roles_select_auth" ON public.user_roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "user_roles_admin_all" ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin')) WITH CHECK (public.has_role(auth.uid(),'super_admin'));

-- signup trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email,'@',1)), COALESCE(NEW.email,''));
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, CASE WHEN (SELECT count(*) FROM public.user_roles) = 0 THEN 'super_admin'::public.app_role ELSE 'operador'::public.app_role END);
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RONDAS
CREATE TABLE public.rondas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data DATE NOT NULL DEFAULT current_date,
  turno TEXT NOT NULL,
  localidade TEXT NOT NULL DEFAULT 'Data Center AGU',
  responsavel_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  temperatura NUMERIC,
  umidade NUMERIC,
  resultado_geral public.criticidade NOT NULL DEFAULT 'baixa',
  total_nc INTEGER NOT NULL DEFAULT 0,
  observacoes TEXT,
  finalizada BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rondas TO authenticated;
GRANT ALL ON public.rondas TO service_role;
ALTER TABLE public.rondas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rondas_select" ON public.rondas FOR SELECT TO authenticated USING (true);
CREATE POLICY "rondas_insert" ON public.rondas FOR INSERT TO authenticated WITH CHECK (responsavel_id = auth.uid());
CREATE POLICY "rondas_update" ON public.rondas FOR UPDATE TO authenticated USING (responsavel_id = auth.uid() OR public.is_manager(auth.uid()));
CREATE POLICY "rondas_delete" ON public.rondas FOR DELETE TO authenticated USING (public.is_manager(auth.uid()));
CREATE TRIGGER trg_rondas_updated BEFORE UPDATE ON public.rondas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.ronda_itens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ronda_id UUID NOT NULL REFERENCES public.rondas(id) ON DELETE CASCADE,
  secao TEXT NOT NULL,
  item TEXT NOT NULL,
  status public.item_status NOT NULL DEFAULT 'C',
  observacao TEXT,
  foto_url TEXT,
  criticidade public.criticidade,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ronda_itens TO authenticated;
GRANT ALL ON public.ronda_itens TO service_role;
ALTER TABLE public.ronda_itens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ronda_itens_select" ON public.ronda_itens FOR SELECT TO authenticated USING (true);
CREATE POLICY "ronda_itens_write" ON public.ronda_itens FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.rondas r WHERE r.id = ronda_id AND (r.responsavel_id = auth.uid() OR public.is_manager(auth.uid()))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.rondas r WHERE r.id = ronda_id AND (r.responsavel_id = auth.uid() OR public.is_manager(auth.uid()))));

-- PASSAGENS DE TURNO
CREATE TABLE public.passagens_turno (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data DATE NOT NULL DEFAULT current_date,
  turno TEXT NOT NULL,
  operador_entrega_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  operador_recebe_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status_sistemas TEXT,
  incidentes_ativos TEXT,
  mudancas_realizadas TEXT,
  status_aceite public.aceite_status NOT NULL DEFAULT 'pendente',
  prazo_aceite TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '15 minutes'),
  aceito_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.passagens_turno TO authenticated;
GRANT ALL ON public.passagens_turno TO service_role;
ALTER TABLE public.passagens_turno ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pt_select" ON public.passagens_turno FOR SELECT TO authenticated USING (true);
CREATE POLICY "pt_insert" ON public.passagens_turno FOR INSERT TO authenticated WITH CHECK (operador_entrega_id = auth.uid());
CREATE POLICY "pt_update" ON public.passagens_turno FOR UPDATE TO authenticated
  USING (operador_entrega_id = auth.uid() OR operador_recebe_id = auth.uid() OR public.is_manager(auth.uid()));
CREATE POLICY "pt_delete" ON public.passagens_turno FOR DELETE TO authenticated USING (public.is_manager(auth.uid()));
CREATE TRIGGER trg_pt_updated BEFORE UPDATE ON public.passagens_turno FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.passagem_pendencias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  passagem_id UUID NOT NULL REFERENCES public.passagens_turno(id) ON DELETE CASCADE,
  descricao TEXT NOT NULL,
  responsavel TEXT,
  prazo DATE,
  risco public.criticidade NOT NULL DEFAULT 'baixa',
  resolvida BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.passagem_pendencias TO authenticated;
GRANT ALL ON public.passagem_pendencias TO service_role;
ALTER TABLE public.passagem_pendencias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pp_select" ON public.passagem_pendencias FOR SELECT TO authenticated USING (true);
CREATE POLICY "pp_write" ON public.passagem_pendencias FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- FORNECEDORES
CREATE TABLE public.fornecedores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  razao_social TEXT NOT NULL,
  contato_nome TEXT,
  contato_email TEXT,
  contato_telefone TEXT,
  documento TEXT,
  validade_credencial DATE,
  tarefas_autorizadas TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fornecedores TO authenticated;
GRANT ALL ON public.fornecedores TO service_role;
ALTER TABLE public.fornecedores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "forn_select" ON public.fornecedores FOR SELECT TO authenticated USING (true);
CREATE POLICY "forn_write" ON public.fornecedores FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER trg_forn_updated BEFORE UPDATE ON public.fornecedores FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ATIVIDADES
CREATE TABLE public.atividades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo SERIAL,
  tipo public.atividade_tipo NOT NULL,
  titulo TEXT NOT NULL,
  descricao TEXT,
  ativo_afetado TEXT,
  criticidade public.criticidade NOT NULL DEFAULT 'media',
  fornecedor_id UUID REFERENCES public.fornecedores(id) ON DELETE SET NULL,
  status public.atividade_status NOT NULL DEFAULT 'aberta',
  janela_inicio TIMESTAMPTZ,
  janela_fim TIMESTAMPTZ,
  aberta_por UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  aberta_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  fechada_em TIMESTAMPTZ,
  email_enviado_em TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.atividades TO authenticated;
GRANT ALL ON public.atividades TO service_role;
ALTER TABLE public.atividades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ativ_select" ON public.atividades FOR SELECT TO authenticated USING (true);
CREATE POLICY "ativ_insert" ON public.atividades FOR INSERT TO authenticated WITH CHECK (aberta_por = auth.uid());
CREATE POLICY "ativ_update" ON public.atividades FOR UPDATE TO authenticated USING (true);
CREATE POLICY "ativ_delete" ON public.atividades FOR DELETE TO authenticated USING (public.is_manager(auth.uid()));
CREATE TRIGGER trg_ativ_updated BEFORE UPDATE ON public.atividades FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.atividade_evidencias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  atividade_id UUID NOT NULL REFERENCES public.atividades(id) ON DELETE CASCADE,
  tipo public.evidencia_tipo NOT NULL,
  arquivo_url TEXT NOT NULL,
  descricao TEXT,
  enviado_por UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  enviado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.atividade_evidencias TO authenticated;
GRANT ALL ON public.atividade_evidencias TO service_role;
ALTER TABLE public.atividade_evidencias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "evid_select" ON public.atividade_evidencias FOR SELECT TO authenticated USING (true);
CREATE POLICY "evid_insert" ON public.atividade_evidencias FOR INSERT TO authenticated WITH CHECK (enviado_por = auth.uid());
CREATE POLICY "evid_delete" ON public.atividade_evidencias FOR DELETE TO authenticated USING (enviado_por = auth.uid() OR public.is_manager(auth.uid()));

-- VISITAS
CREATE TABLE public.visitas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fornecedor_id UUID REFERENCES public.fornecedores(id) ON DELETE SET NULL,
  atividade_id UUID REFERENCES public.atividades(id) ON DELETE SET NULL,
  pessoa_nome TEXT NOT NULL,
  documento TEXT,
  foto_documento_url TEXT,
  zona TEXT NOT NULL DEFAULT 'Sala de Servidores',
  checkin_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  checkout_em TIMESTAMPTZ,
  duracao_prevista_min INTEGER NOT NULL DEFAULT 120,
  acompanhante_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  consentimento_lgpd BOOLEAN NOT NULL DEFAULT false,
  registrado_por UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.visitas TO authenticated;
GRANT ALL ON public.visitas TO service_role;
ALTER TABLE public.visitas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vis_select" ON public.visitas FOR SELECT TO authenticated USING (true);
CREATE POLICY "vis_insert" ON public.visitas FOR INSERT TO authenticated WITH CHECK (registrado_por = auth.uid());
CREATE POLICY "vis_update" ON public.visitas FOR UPDATE TO authenticated USING (true);
CREATE POLICY "vis_delete" ON public.visitas FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'super_admin'));
CREATE TRIGGER trg_vis_updated BEFORE UPDATE ON public.visitas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- NOTIFICACOES
CREATE TABLE public.notificacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  regra TEXT NOT NULL,
  destinatario TEXT NOT NULL,
  canal TEXT NOT NULL DEFAULT 'email',
  assunto TEXT,
  corpo TEXT,
  enviado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  referencia_tipo TEXT,
  referencia_id UUID
);
GRANT SELECT, INSERT ON public.notificacoes TO authenticated;
GRANT ALL ON public.notificacoes TO service_role;
ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notif_select" ON public.notificacoes FOR SELECT TO authenticated USING (true);
CREATE POLICY "notif_insert" ON public.notificacoes FOR INSERT TO authenticated WITH CHECK (true);

-- REGRAS DE ESCALONAMENTO
CREATE TABLE public.regras_escalonamento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evento TEXT NOT NULL,
  prazo_minutos INTEGER NOT NULL DEFAULT 15,
  destinatarios TEXT NOT NULL,
  nivel INTEGER NOT NULL DEFAULT 1,
  ativa BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.regras_escalonamento TO authenticated;
GRANT ALL ON public.regras_escalonamento TO service_role;
ALTER TABLE public.regras_escalonamento ENABLE ROW LEVEL SECURITY;
CREATE POLICY "regras_select" ON public.regras_escalonamento FOR SELECT TO authenticated USING (true);
CREATE POLICY "regras_admin" ON public.regras_escalonamento FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin')) WITH CHECK (public.has_role(auth.uid(),'super_admin'));
CREATE TRIGGER trg_regras_updated BEFORE UPDATE ON public.regras_escalonamento FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RELATORIOS MENSAIS
CREATE TABLE public.relatorios_mensais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo TEXT NOT NULL,
  periodo_referencia TEXT NOT NULL,
  conteudo JSONB,
  gerado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  arquivo_pdf_url TEXT,
  destinatarios TEXT
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.relatorios_mensais TO authenticated;
GRANT ALL ON public.relatorios_mensais TO service_role;
ALTER TABLE public.relatorios_mensais ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rel_select" ON public.relatorios_mensais FOR SELECT TO authenticated USING (public.is_manager(auth.uid()));
CREATE POLICY "rel_write" ON public.relatorios_mensais FOR ALL TO authenticated
  USING (public.is_manager(auth.uid())) WITH CHECK (public.is_manager(auth.uid()));

-- AUDITORIA
CREATE TABLE public.auditoria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  acao TEXT NOT NULL,
  entidade TEXT NOT NULL,
  entidade_id UUID,
  detalhes JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.auditoria TO authenticated;
GRANT ALL ON public.auditoria TO service_role;
ALTER TABLE public.auditoria ENABLE ROW LEVEL SECURITY;
CREATE POLICY "aud_select" ON public.auditoria FOR SELECT TO authenticated USING (public.is_manager(auth.uid()));
CREATE POLICY "aud_insert" ON public.auditoria FOR INSERT TO authenticated WITH CHECK (usuario_id = auth.uid());

-- STORAGE POLICIES (bucket criado separadamente)
CREATE POLICY "evidencias_read" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'evidencias');
CREATE POLICY "evidencias_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'evidencias');
CREATE POLICY "evidencias_update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'evidencias');
