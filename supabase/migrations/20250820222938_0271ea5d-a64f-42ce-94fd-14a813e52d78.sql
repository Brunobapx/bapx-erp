-- Remove existing permissive policies for nota_configuracoes
DROP POLICY IF EXISTS "Company can select nota_configuracoes" ON public.nota_configuracoes;
DROP POLICY IF EXISTS "Company can insert nota_configuracoes" ON public.nota_configuracoes;
DROP POLICY IF EXISTS "Company can update nota_configuracoes" ON public.nota_configuracoes;
DROP POLICY IF EXISTS "Company can delete nota_configuracoes" ON public.nota_configuracoes;

-- Create restrictive policies that only allow admin access
CREATE POLICY "Only admins can manage nota_configuracoes"
ON public.nota_configuracoes
FOR ALL
USING (
  is_admin(auth.uid()) AND 
  (company_id = current_user_company_id() OR (company_id IS NULL AND validate_company_access(user_id)))
)
WITH CHECK (
  is_admin(auth.uid()) AND 
  (company_id = current_user_company_id() OR (company_id IS NULL AND validate_company_access(user_id)))
);

-- Update existing records to have proper company_id if missing
UPDATE public.nota_configuracoes 
SET company_id = current_user_company_id()
WHERE company_id IS NULL;