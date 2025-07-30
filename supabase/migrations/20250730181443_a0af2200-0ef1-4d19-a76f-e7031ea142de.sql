-- Adicionar campo is_service na tabela products
ALTER TABLE public.products 
ADD COLUMN is_service boolean NOT NULL DEFAULT false;

-- Atualizar alguns produtos existentes como exemplo (produtos típicos de serviço)
UPDATE public.products 
SET is_service = true 
WHERE name ILIKE '%manutenção%' 
   OR name ILIKE '%reparo%' 
   OR name ILIKE '%instalação%' 
   OR name ILIKE '%serviço%' 
   OR name ILIKE '%assistência%';