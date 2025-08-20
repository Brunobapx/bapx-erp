-- Update system_settings RLS policy to require admin access for sensitive keys
DROP POLICY IF EXISTS "Company can manage system settings" ON public.system_settings;

-- Create separate policies for different types of access
-- Non-sensitive system settings can be accessed by all company users
CREATE POLICY "Company users can access non-sensitive settings"
ON public.system_settings
FOR SELECT
USING (
  company_id = current_user_company_id() 
  AND key NOT IN ('focus_nfe_token', 'api_token', 'secret', 'password', 'key')
  AND key NOT LIKE '%token%'
  AND key NOT LIKE '%secret%'
  AND key NOT LIKE '%password%'
  AND key NOT LIKE '%key%'
);

-- Only admins can access sensitive settings (tokens, secrets, etc.)
CREATE POLICY "Only admins can access sensitive settings"
ON public.system_settings
FOR ALL
USING (
  is_admin(auth.uid()) 
  AND company_id = current_user_company_id()
  AND (
    key IN ('focus_nfe_token', 'api_token', 'secret', 'password', 'key')
    OR key LIKE '%token%'
    OR key LIKE '%secret%'
    OR key LIKE '%password%'
    OR key LIKE '%key%'
  )
)
WITH CHECK (
  is_admin(auth.uid()) 
  AND company_id = current_user_company_id()
  AND (
    key IN ('focus_nfe_token', 'api_token', 'secret', 'password', 'key')
    OR key LIKE '%token%'
    OR key LIKE '%secret%'
    OR key LIKE '%password%'
    OR key LIKE '%key%'
  )
);

-- Admins can manage all non-sensitive settings for their company
CREATE POLICY "Admins can manage non-sensitive settings"
ON public.system_settings
FOR ALL
USING (
  is_admin(auth.uid()) 
  AND company_id = current_user_company_id()
  AND key NOT IN ('focus_nfe_token', 'api_token', 'secret', 'password', 'key')
  AND key NOT LIKE '%token%'
  AND key NOT LIKE '%secret%'
  AND key NOT LIKE '%password%'
  AND key NOT LIKE '%key%'
)
WITH CHECK (
  is_admin(auth.uid()) 
  AND company_id = current_user_company_id()
  AND key NOT IN ('focus_nfe_token', 'api_token', 'secret', 'password', 'key')
  AND key NOT LIKE '%token%'
  AND key NOT LIKE '%secret%'
  AND key NOT LIKE '%password%'
  AND key NOT LIKE '%key%'
);