-- Corrigir políticas RLS recursivas na tabela user_roles
-- Remover políticas problemáticas que causam recursão
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles;

-- Criar políticas mais simples sem recursão
CREATE POLICY "Users can view their own role" 
ON public.user_roles 
FOR SELECT 
USING (auth.uid() = user_id);

-- Política para admins visualizarem todas as roles (sem usar a própria tabela user_roles na verificação)
CREATE POLICY "Service role can manage all roles" 
ON public.user_roles 
FOR ALL 
USING (auth.jwt() ->> 'role' = 'service_role');

-- Política temporária para permitir que usuários autenticados vejam roles (para não quebrar o sistema)
CREATE POLICY "Authenticated users can view roles" 
ON public.user_roles 
FOR SELECT 
USING (auth.role() = 'authenticated');

-- Atualizar função is_admin para ser mais segura
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  -- Verificação simples sem causar recursão
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = COALESCE($1, auth.uid()) 
    AND role IN ('admin', 'master')
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;