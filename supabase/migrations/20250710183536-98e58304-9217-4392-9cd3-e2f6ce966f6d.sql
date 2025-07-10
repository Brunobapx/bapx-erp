-- Adicionar campo is_active na tabela products se não existir
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;