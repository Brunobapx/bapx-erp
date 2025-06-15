
-- Adiciona a coluna 'account' na tabela 'accounts_payable'
ALTER TABLE public.accounts_payable
ADD COLUMN account TEXT;

-- Opcional: pode adicionar um comentário na coluna para clareza
COMMENT ON COLUMN public.accounts_payable.account IS 'Nome da conta bancária usada para pagamento';

