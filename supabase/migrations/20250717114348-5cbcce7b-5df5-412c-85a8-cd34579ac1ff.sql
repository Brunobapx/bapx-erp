-- Adicionar campos de status e finalização à tabela trocas
ALTER TABLE public.trocas 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pendente',
ADD COLUMN IF NOT EXISTS data_finalizacao TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS recebido_por TEXT;