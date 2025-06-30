
-- Primeiro, vamos verificar se existe a usuária Nathalia no auth.users
-- e se ela tem perfil na tabela profiles

-- Encontrar a usuária Nathalia
DO $$
DECLARE
    nathalia_user_id UUID;
    default_company_id UUID;
BEGIN
    -- Buscar o ID da usuária Nathalia
    SELECT id INTO nathalia_user_id 
    FROM auth.users 
    WHERE email = 'nathalia@vanuzasampaio.com.br';
    
    -- Se encontrou a usuária
    IF nathalia_user_id IS NOT NULL THEN
        -- Buscar uma empresa padrão (pode ser 'main' ou a primeira disponível)
        SELECT id INTO default_company_id 
        FROM public.companies 
        WHERE subdomain = 'main' OR is_active = true 
        ORDER BY created_at ASC 
        LIMIT 1;
        
        -- Se não existe perfil para esta usuária, criar
        IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = nathalia_user_id) THEN
            INSERT INTO public.profiles (
                id, 
                first_name, 
                last_name, 
                company_id,
                is_active
            ) VALUES (
                nathalia_user_id,
                'Nathalia',
                '',
                default_company_id,
                true
            );
            
            RAISE NOTICE 'Perfil criado para usuária Nathalia';
        ELSE
            -- Se já existe perfil, apenas atualizar o company_id se estiver NULL
            UPDATE public.profiles 
            SET company_id = default_company_id
            WHERE id = nathalia_user_id AND company_id IS NULL;
            
            RAISE NOTICE 'Perfil da usuária Nathalia atualizado';
        END IF;
        
        -- Verificar se existe user_role para esta usuária
        IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = nathalia_user_id) THEN
            INSERT INTO public.user_roles (
                user_id,
                role,
                company_id
            ) VALUES (
                nathalia_user_id,
                'user',
                default_company_id
            );
            
            RAISE NOTICE 'Role criado para usuária Nathalia';
        END IF;
    ELSE
        RAISE NOTICE 'Usuária Nathalia não encontrada na tabela auth.users';
    END IF;
END $$;

-- Verificar e corrigir outros usuários que possam ter problemas similares
DO $$
DECLARE
    user_record RECORD;
    default_company_id UUID;
BEGIN
    -- Buscar uma empresa padrão
    SELECT id INTO default_company_id 
    FROM public.companies 
    WHERE subdomain = 'main' OR is_active = true 
    ORDER BY created_at ASC 
    LIMIT 1;
    
    -- Encontrar usuários do auth.users que não têm perfil
    FOR user_record IN 
        SELECT au.id, au.email
        FROM auth.users au
        LEFT JOIN public.profiles p ON au.id = p.id
        WHERE p.id IS NULL
        AND au.email IS NOT NULL
    LOOP
        -- Criar perfil para usuários sem perfil
        INSERT INTO public.profiles (
            id,
            first_name,
            last_name,
            company_id,
            is_active
        ) VALUES (
            user_record.id,
            '',
            '',
            default_company_id,
            true
        );
        
        -- Criar role padrão se não existir
        IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = user_record.id) THEN
            INSERT INTO public.user_roles (
                user_id,
                role,
                company_id
            ) VALUES (
                user_record.id,
                'user',
                default_company_id
            );
        END IF;
        
        RAISE NOTICE 'Perfil e role criados para usuário: %', user_record.email;
    END LOOP;
    
    -- Corrigir perfis existentes que têm company_id NULL
    UPDATE public.profiles 
    SET company_id = default_company_id
    WHERE company_id IS NULL;
    
    -- Corrigir user_roles que têm company_id NULL
    UPDATE public.user_roles 
    SET company_id = default_company_id
    WHERE company_id IS NULL;
END $$;
