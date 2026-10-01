ALTER TABLE public.profiles ALTER COLUMN ativo SET DEFAULT false;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, email, ativo)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.email, ''),
    false
  );
  RETURN NEW;
END;
$$;

DROP POLICY IF EXISTS "user_roles_admin_all" ON public.user_roles;

CREATE POLICY "user_roles_manager_insert"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_manager(auth.uid())
  AND (role <> 'super_admin'::public.app_role OR public.has_role(auth.uid(), 'super_admin'::public.app_role))
);

CREATE POLICY "user_roles_manager_update"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (
  public.is_manager(auth.uid())
  AND (role <> 'super_admin'::public.app_role OR public.has_role(auth.uid(), 'super_admin'::public.app_role))
)
WITH CHECK (
  public.is_manager(auth.uid())
  AND (role <> 'super_admin'::public.app_role OR public.has_role(auth.uid(), 'super_admin'::public.app_role))
);

CREATE POLICY "user_roles_manager_delete"
ON public.user_roles
FOR DELETE
TO authenticated
USING (
  public.is_manager(auth.uid())
  AND (role <> 'super_admin'::public.app_role OR public.has_role(auth.uid(), 'super_admin'::public.app_role))
);