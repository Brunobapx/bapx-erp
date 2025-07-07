-- Atualizar ou inserir role master para o usuário bruno@bapx.com.br
DO $$
DECLARE
    bruno_user_id UUID;
BEGIN
    -- Buscar o ID do usuário bruno@bapx.com.br
    SELECT id INTO bruno_user_id 
    FROM auth.users 
    WHERE email = 'bruno@bapx.com.br';
    
    -- Se encontrou o usuário, atualizar ou inserir role
    IF bruno_user_id IS NOT NULL THEN
        -- Tentar atualizar primeiro
        UPDATE public.user_roles 
        SET role = 'master', updated_at = now()
        WHERE user_id = bruno_user_id;
        
        -- Se não atualizou nenhuma linha, inserir nova
        IF NOT FOUND THEN
            INSERT INTO public.user_roles (user_id, role)
            VALUES (bruno_user_id, 'master');
        END IF;
        
        RAISE NOTICE 'Role master atribuído ao usuário bruno@bapx.com.br (ID: %)', bruno_user_id;
    ELSE
        RAISE NOTICE 'Usuário bruno@bapx.com.br não encontrado na tabela auth.users';
    END IF;
END$$;

-- Atualizar função is_admin para incluir master
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = $1 AND role IN ('admin', 'master')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;