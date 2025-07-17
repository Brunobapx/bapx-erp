-- Remover campo motivo da tabela trocas (já foi movido para troca_itens)
ALTER TABLE public.trocas DROP COLUMN IF EXISTS motivo;