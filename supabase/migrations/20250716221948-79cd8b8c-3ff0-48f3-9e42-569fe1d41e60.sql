-- Adicionar campo motivo na tabela troca_itens
ALTER TABLE public.troca_itens 
ADD COLUMN motivo text NOT NULL DEFAULT '';