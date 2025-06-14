
-- Adicionar a coluna bairro à tabela clients
ALTER TABLE public.clients
  ADD COLUMN bairro text;

-- (Opcional) Adicionar também as colunas number e complement, que são usadas no formulário visual
ALTER TABLE public.clients
  ADD COLUMN number text,
  ADD COLUMN complement text;
