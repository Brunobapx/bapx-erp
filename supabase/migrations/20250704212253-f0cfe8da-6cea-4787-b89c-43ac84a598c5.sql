-- Remover sistema completo de usuários e perfis - Parte 1: Dependências

-- Dropar policies que dependem das funções de usuário
DROP POLICY IF EXISTS "Masters can manage all companies" ON public.companies;
DROP POLICY IF EXISTS "Admins/masters podem ver/configurar" ON public.system_settings;
DROP POLICY IF EXISTS "Master users can update settings" ON public.system_settings;
DROP POLICY IF EXISTS "Master users can view all settings" ON public.system_settings;

-- Recriar policies simples sem dependência de funções de usuário
CREATE POLICY "Anyone can view companies" ON public.companies FOR SELECT USING (true);
CREATE POLICY "Anyone can view system settings" ON public.system_settings FOR SELECT USING (true);
CREATE POLICY "Anyone can update system settings" ON public.system_settings FOR ALL USING (true);