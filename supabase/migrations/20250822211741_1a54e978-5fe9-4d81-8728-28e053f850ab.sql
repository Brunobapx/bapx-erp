-- Adicionar campos fiscais faltantes na tabela products
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS cest text,
ADD COLUMN IF NOT EXISTS cst_csosn text DEFAULT '101';

-- Comentários para documentar os campos
COMMENT ON COLUMN public.products.cest IS 'Código Especificador da Substituição Tributária';
COMMENT ON COLUMN public.products.cst_csosn IS 'Código de Situação Tributária - CST ou CSOSN';