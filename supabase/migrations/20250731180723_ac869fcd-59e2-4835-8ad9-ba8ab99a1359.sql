-- Tentar uma inserção de teste diretamente para verificar se o problema persiste
-- Verificar se conseguimos inserir na tabela orders
-- Esta é apenas uma query de teste, vamos remover o registro depois

DO $$
DECLARE
    test_order_id uuid;
BEGIN
    -- Tentar inserir um pedido de teste
    INSERT INTO public.orders (
        user_id, 
        client_id, 
        client_name, 
        order_number, 
        total_amount, 
        status
    ) VALUES (
        '18da4fb4-2403-404c-9195-74b5c6377f81', -- ID de usuário de teste
        '00000000-0000-0000-0000-000000000001', -- ID de cliente de teste
        'Cliente Teste',
        'TEST-001',
        100.00,
        'pending'
    ) RETURNING id INTO test_order_id;
    
    -- Remover o registro de teste imediatamente
    DELETE FROM public.orders WHERE id = test_order_id;
    
    RAISE NOTICE 'Teste de inserção na tabela orders: SUCESSO';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Erro no teste de inserção: %', SQLERRM;
END $$;