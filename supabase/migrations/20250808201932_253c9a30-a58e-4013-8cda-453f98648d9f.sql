BEGIN;

-- Force RLS and add restrictive policies for system_settings to ensure company isolation
ALTER TABLE public.system_settings FORCE ROW LEVEL SECURITY;

-- Create restrictive policies (they AND with any existing permissive ones)
DROP POLICY IF EXISTS "system_settings_select_company" ON public.system_settings;
CREATE POLICY "system_settings_select_company"
AS RESTRICTIVE
ON public.system_settings
FOR SELECT
USING (company_id = public.current_user_company_id());

DROP POLICY IF EXISTS "system_settings_insert_company" ON public.system_settings;
CREATE POLICY "system_settings_insert_company"
AS RESTRICTIVE
ON public.system_settings
FOR INSERT
WITH CHECK (company_id = public.current_user_company_id());

DROP POLICY IF EXISTS "system_settings_update_company" ON public.system_settings;
CREATE POLICY "system_settings_update_company"
AS RESTRICTIVE
ON public.system_settings
FOR UPDATE
USING (company_id = public.current_user_company_id())
WITH CHECK (company_id = public.current_user_company_id());

DROP POLICY IF EXISTS "system_settings_delete_company" ON public.system_settings;
CREATE POLICY "system_settings_delete_company"
AS RESTRICTIVE
ON public.system_settings
FOR DELETE
USING (company_id = public.current_user_company_id());

COMMIT;