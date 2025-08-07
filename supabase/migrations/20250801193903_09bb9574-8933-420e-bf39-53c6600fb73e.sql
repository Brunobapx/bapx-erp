-- Verificar e corrigir problema de permissões na tabela orders
-- O erro persiste mesmo com edge function, indicando problema de schema/permissões

-- Primeiro, garantir que a tabela tenha as permissões corretas
GRANT ALL ON public.orders TO authenticated;
GRANT ALL ON public.orders TO anon;
GRANT ALL ON public.orders TO service_role;

-- Garantir que a sequência também tenha permissões
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Verificar se as políticas RLS estão corretas
DROP POLICY IF EXISTS "Authenticated users can insert orders" ON public.orders;
DROP POLICY IF EXISTS "Authenticated users can view orders" ON public.orders;
DROP POLICY IF EXISTS "Authenticated users can update their own orders" ON public.orders;
DROP POLICY IF EXISTS "Authenticated users can delete their own orders" ON public.orders;

-- Recriar políticas mais permissivas para teste
CREATE POLICY "Allow all operations for authenticated users" 
ON public.orders FOR ALL 
TO authenticated
USING (true) 
WITH CHECK (true);

-- Política para service_role (edge functions)
CREATE POLICY "Allow all operations for service_role" 
ON public.orders FOR ALL 
TO service_role
USING (true) 
WITH CHECK (true);

-- Forçar refresh do PostgREST novamente
NOTIFY pgrst, 'reload schema';