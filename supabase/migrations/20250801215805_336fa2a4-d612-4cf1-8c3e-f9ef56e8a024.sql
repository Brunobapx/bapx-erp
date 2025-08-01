-- Adicionar colunas seller_id e seller_name à tabela orders
ALTER TABLE public.orders 
ADD COLUMN seller_id uuid,
ADD COLUMN seller_name text;