
-- Corrigir problema de chave estrangeira antes de remover usuários
-- Primeiro, remover referências de profile_id na tabela profiles
UPDATE public.profiles SET profile_id = NULL;

-- Depois, buscar o ID do usuário master e limpar outros usuários
DO $$
DECLARE
    master_user_id UUID;
BEGIN
    -- Buscar o ID do usuário master pelo email
    SELECT id INTO master_user_id 
    FROM auth.users 
    WHERE email = 'bruno@bapx.com.br';
    
    -- Se encontrou o usuário master, limpar todos os outros
    IF master_user_id IS NOT NULL THEN
        -- Deletar registros relacionados de outros usuários
        DELETE FROM public.user_roles WHERE user_id != master_user_id;
        DELETE FROM public.profiles WHERE id != master_user_id;
        
        -- Garantir que o master tenha o role correto
        UPDATE public.user_roles 
        SET role = 'master' 
        WHERE user_id = master_user_id;
        
        -- Se não existir role para o master, criar
        INSERT INTO public.user_roles (user_id, role, company_id)
        SELECT master_user_id, 'master', c.id
        FROM public.companies c
        WHERE NOT EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = master_user_id
        )
        LIMIT 1;
    END IF;
END $$;

-- Agora limpar as tabelas de perfis de acesso
DELETE FROM public.profile_modules;
DELETE FROM public.access_profiles;
DELETE FROM public.system_modules;

-- Criar ou atualizar função para configurar módulos automaticamente ao criar usuário
CREATE OR REPLACE FUNCTION public.setup_user_modules_on_role_creation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Quando um user_role é criado ou atualizado, configurar os módulos
    IF NEW.role = 'master' OR NEW.role = 'admin' THEN
        -- Master e Admin têm acesso a todos os módulos (controlado via código)
        NULL;
    ELSIF NEW.role = 'user' THEN
        -- Usuários comuns têm acesso limitado (controlado via código)
        NULL;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Criar trigger para configurar módulos automaticamente
DROP TRIGGER IF EXISTS setup_user_modules_trigger ON public.user_roles;
CREATE TRIGGER setup_user_modules_trigger
    AFTER INSERT OR UPDATE OF role ON public.user_roles
    FOR EACH ROW
    EXECUTE FUNCTION public.setup_user_modules_on_role_creation();
