
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS is_direct_sale boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.products.is_direct_sale IS 'Indica se o produto é de venda direta. Não pode ser combinado com produto fabricado.';
