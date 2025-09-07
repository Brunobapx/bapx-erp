-- Primeiro, vamos verificar se a empresa Ravis existe e obter seu ID
DO $$
DECLARE
    ravis_company_id uuid;
BEGIN
    -- Buscar a empresa Ravis
    SELECT id INTO ravis_company_id FROM companies WHERE code = '03' LIMIT 1;
    
    -- Se encontrou a empresa, inserir produtos de exemplo
    IF ravis_company_id IS NOT NULL THEN
        -- Inserir produtos de exemplo para a empresa Ravis
        INSERT INTO products (
            id,
            company_id,
            user_id,
            name,
            description,
            price,
            stock,
            category,
            is_active,
            is_direct_sale,
            is_manufactured,
            code,
            sku,
            unit,
            cost
        ) VALUES 
        (
            gen_random_uuid(),
            ravis_company_id,
            ravis_company_id, -- usando company_id como user_id temporariamente
            'Produto Exemplo 1',
            'Descrição do primeiro produto de exemplo para teste da loja',
            29.99,
            50,
            'Categoria A',
            true,
            true,
            false,
            'PROD001',
            'SKU001',
            'UN',
            15.99
        ),
        (
            gen_random_uuid(),
            ravis_company_id,
            ravis_company_id,
            'Produto Exemplo 2',
            'Segundo produto para demonstração do catálogo online',
            45.50,
            30,
            'Categoria B',
            true,
            true,
            false,
            'PROD002',
            'SKU002',
            'UN',
            25.00
        ),
        (
            gen_random_uuid(),
            ravis_company_id,
            ravis_company_id,
            'Produto Premium',
            'Produto premium com alta qualidade e acabamento especial',
            89.90,
            15,
            'Premium',
            true,
            true,
            false,
            'PROD003',
            'SKU003',
            'UN',
            45.00
        ),
        (
            gen_random_uuid(),
            ravis_company_id,
            ravis_company_id,
            'Kit Especial',
            'Kit completo com múltiplos itens para uso profissional',
            129.99,
            8,
            'Kits',
            true,
            true,
            false,
            'PROD004',
            'SKU004',
            'UN',
            65.00
        ),
        (
            gen_random_uuid(),
            ravis_company_id,
            ravis_company_id,
            'Produto Básico',
            'Produto de entrada com ótimo custo-benefício',
            19.99,
            100,
            'Básicos',
            true,
            true,
            false,
            'PROD005',
            'SKU005',
            'UN',
            8.99
        );
        
        RAISE NOTICE 'Produtos de exemplo inseridos para a empresa Ravis (ID: %)', ravis_company_id;
    ELSE
        RAISE NOTICE 'Empresa Ravis não encontrada com código 03';
    END IF;
END $$;