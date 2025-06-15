
-- Adiciona a coluna 'invoice_number' à tabela financial_entries
ALTER TABLE public.financial_entries ADD COLUMN invoice_number text;

-- Comentário: Campo poderá ser usado por lançamentos de receita (recebíveis)
