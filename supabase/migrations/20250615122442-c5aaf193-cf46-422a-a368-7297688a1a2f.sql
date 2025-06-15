
-- Desabilitar o trigger que está causando conflito
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Modificar a função para não interferir quando company_id já está sendo gerenciado
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  default_company_id UUID;
BEGIN
  -- Se já houver um perfil criado para este usuário, não faz nada
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.id) THEN
    RETURN NEW;
  END IF;

  -- Aguardar um pouco para dar tempo da Edge Function criar o perfil
  -- Se após 5 segundos não houver perfil, criar um padrão
  PERFORM pg_sleep(5);
  
  -- Verificar novamente se o perfil foi criado
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.id) THEN
    RETURN NEW;
  END IF;

  -- Se chegou até aqui, criar perfil padrão
  SELECT id INTO default_company_id FROM public.companies WHERE subdomain = 'main' LIMIT 1;

  INSERT INTO public.profiles (id, first_name, last_name, company_id)
  VALUES (NEW.id, '', '', default_company_id);

  RETURN NEW;
END;
$$;

-- Recriar o trigger com delay
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE PROCEDURE public.handle_new_user();

-- Limpar usuários duplicados ou com dados inconsistentes
-- Primeiro, identificar e remover perfis duplicados mantendo o mais recente
DELETE FROM public.profiles 
WHERE id IN (
  SELECT id FROM (
    SELECT id, 
           ROW_NUMBER() OVER (PARTITION BY id ORDER BY created_at DESC) as rn
    FROM public.profiles
  ) ranked 
  WHERE rn > 1
);

-- Remover user_roles órfãos (sem perfil correspondente)
DELETE FROM public.user_roles 
WHERE user_id NOT IN (SELECT id FROM public.profiles);

-- Atualizar perfis que possam ter company_id incorreto
-- (mantém apenas perfis que têm user_roles correspondentes)
UPDATE public.profiles 
SET company_id = ur.company_id
FROM public.user_roles ur 
WHERE profiles.id = ur.user_id 
AND profiles.company_id != ur.company_id;
