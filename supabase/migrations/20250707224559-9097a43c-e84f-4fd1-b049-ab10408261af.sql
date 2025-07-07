-- Corrigir políticas RLS para permitir inserção de roles
-- Remover políticas existentes que podem estar causando problemas
DROP POLICY IF EXISTS "Authenticated users can view roles" ON public.user_roles;
DROP POLICY IF EXISTS "Service role can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles;

-- Criar políticas mais permissivas para permitir criação de roles
CREATE POLICY "Users can view their own role" 
ON public.user_roles 
FOR SELECT 
USING (auth.uid() = user_id);

-- Política para permitir inserção de roles (necessário para signup)
CREATE POLICY "Users can insert their own role" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Política para service role gerenciar tudo
CREATE POLICY "Service role can manage all roles" 
ON public.user_roles 
FOR ALL 
USING (auth.jwt() ->> 'role' = 'service_role');

-- Inserir role admin para o usuário recém criado
INSERT INTO public.user_roles (user_id, role)
VALUES ('9c5f283e-72ff-44bb-8e32-be9fa463a91c', 'admin')
ON CONFLICT DO NOTHING;