-- Corrigir a coluna order_item_id para permitir NULL para produções internas
ALTER TABLE public.production 
ALTER COLUMN order_item_id DROP NOT NULL;