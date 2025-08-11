-- Enforce company isolation for sellers and users across companies (fixed DO/EXECUTE quoting)

-- 1) Enable RLS and add policies on user_positions
DO $do$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_positions') THEN
    EXECUTE 'ALTER TABLE public.user_positions ENABLE ROW LEVEL SECURITY';

    IF EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'public' AND tablename = 'user_positions' AND policyname = 'user_positions_company_access'
    ) THEN
      EXECUTE 'DROP POLICY user_positions_company_access ON public.user_positions';
    END IF;

    EXECUTE 'CREATE POLICY user_positions_company_access ON public.user_positions FOR ALL USING (public.validate_company_access(user_id)) WITH CHECK (public.validate_company_access(user_id))';
  END IF;
END
$do$;

-- 2) Enable RLS and add policies on user_roles (used as fallback for sellers)
DO $do$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_roles') THEN
    EXECUTE 'ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY';

    IF EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'public' AND tablename = 'user_roles' AND policyname = 'user_roles_company_access'
    ) THEN
      EXECUTE 'DROP POLICY user_roles_company_access ON public.user_roles';
    END IF;

    EXECUTE 'CREATE POLICY user_roles_company_access ON public.user_roles FOR ALL USING (public.validate_company_access(user_id)) WITH CHECK (public.validate_company_access(user_id))';
  END IF;
END
$do$;