-- Adicionar user_id na tabela troca_itens se não existir
ALTER TABLE public.troca_itens 
ADD COLUMN IF NOT EXISTS user_id UUID NOT NULL DEFAULT gen_random_uuid();

-- Verificar se as políticas RLS estão corretas para troca_itens
DROP POLICY IF EXISTS "Authenticated users can manage all troca items" ON troca_itens;
DROP POLICY IF EXISTS "troca_items_company_access" ON troca_itens;

-- Recriar políticas RLS mais simples para troca_itens
CREATE POLICY "Authenticated users can manage troca_itens" 
ON public.troca_itens 
FOR ALL 
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);