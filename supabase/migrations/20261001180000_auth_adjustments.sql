-- Change default for new profiles to inactive (pending)
ALTER TABLE public.profiles ALTER COLUMN ativo SET DEFAULT false;

-- Update handle_new_user to ensure first-time users (except the very first if needed, 
-- but following request "operator pending role assignment") get operator role.
-- Note: The request says "rather than elevated access", so we'll just stick to 'operador'.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, email, ativo)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email,'@',1)), 
    COALESCE(NEW.email,''),
    (SELECT count(*) FROM public.profiles) = 0 -- Keep the very first user active as a failsafe if desired, or set to false. 
                                              -- User said "retain existing super admin", so we keep first user logic.
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id, 
    CASE WHEN (SELECT count(*) FROM public.user_roles) = 0 THEN 'super_admin'::public.app_role ELSE 'operador'::public.app_role END
  );
  RETURN NEW;
END; $$;
