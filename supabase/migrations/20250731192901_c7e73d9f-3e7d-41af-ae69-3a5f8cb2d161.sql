-- Corrigir política RLS de INSERT para orders
-- O problema é que a política atual pode estar impedindo inserções legítimas

-- Primeiro, remover a política atual de INSERT
DROP POLICY IF EXISTS "Users can insert orders" ON orders;

-- Criar nova política mais robusta para INSERT
CREATE POLICY "Users can insert their own orders" 
ON orders 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL AND 
  auth.uid() = user_id
);

-- Verificar se a política de SELECT está correta (pode estar muito restritiva)
DROP POLICY IF EXISTS "Users can view orders from their company" ON orders;

-- Criar política de SELECT mais específica
CREATE POLICY "Users can view orders from their company" 
ON orders 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL AND
  (
    -- Usuário pode ver seus próprios pedidos
    auth.uid() = user_id OR
    -- Ou pedidos onde ele é o vendedor
    auth.uid() = salesperson_id OR
    -- Admins podem ver todos
    is_admin(auth.uid())
  )
);