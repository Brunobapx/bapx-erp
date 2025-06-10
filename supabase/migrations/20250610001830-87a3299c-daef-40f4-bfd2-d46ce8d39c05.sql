
-- Criar política RLS para permitir que usuários master criem empresas
CREATE POLICY "Masters can create companies" ON public.companies
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'master'));

-- Criar política RLS para permitir que usuários master visualizem todas as empresas
CREATE POLICY "Masters can view all companies" ON public.companies
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'master'));

-- Criar política RLS para permitir que usuários master atualizem empresas
CREATE POLICY "Masters can update all companies" ON public.companies
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'master'))
  WITH CHECK (public.has_role(auth.uid(), 'master'));

-- Permitir que usuários vejam apenas sua própria empresa
CREATE POLICY "Users can view own company" ON public.companies
  FOR SELECT TO authenticated
  USING (id = public.get_current_user_company_id());
