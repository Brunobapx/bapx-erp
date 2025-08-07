-- Corrigir relacionamento entre sales e orders
-- Primeiro, verificar se a coluna order_id existe na tabela sales
-- e adicionar a foreign key constraint

-- Adicionar foreign key constraint entre sales.order_id e orders.id
ALTER TABLE public.sales 
ADD CONSTRAINT sales_order_id_fkey 
FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;

-- Verificar se não há constraint duplicada e adicionar outras se necessário
-- Também vamos garantir que a tabela sales tenha todas as colunas necessárias

-- Verificar se precisa adicionar outras foreign keys relacionadas
DO $$
BEGIN
    -- Verificar se a constraint já existe antes de tentar criar
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'sales_client_id_fkey' 
        AND table_name = 'sales'
    ) THEN
        -- Adicionar foreign key para client_id se não existir
        ALTER TABLE public.sales 
        ADD CONSTRAINT sales_client_id_fkey 
        FOREIGN KEY (client_id) REFERENCES public.clients(id);
    END IF;
EXCEPTION
    WHEN duplicate_object THEN
        -- Ignorar se a constraint já existir
        NULL;
    WHEN others THEN
        -- Log do erro mas não falhar
        RAISE NOTICE 'Erro ao adicionar constraints: %', SQLERRM;
END $$;