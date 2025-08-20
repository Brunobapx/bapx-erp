-- Adicionar campos de vendedor na tabela quotes
ALTER TABLE public.quotes 
ADD COLUMN seller_id uuid,
ADD COLUMN seller_name text;