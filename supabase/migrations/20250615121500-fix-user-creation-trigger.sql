
-- Desabilitar o trigger atual que está causando conflito
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Modificar a função para não interferir com a Edge Function
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

  -- Aguardar um momento para dar tempo da Edge Function criar o perfil
  PERFORM pg_sleep(2);
  
  -- Verificar novamente se o perfil foi criado pela Edge Function
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.id) THEN
    RETURN NEW;
  END IF;

  -- Se chegou até aqui, significa que foi criação manual/direta
  -- Criar perfil padrão apenas nesse caso
  SELECT id INTO default_company_id FROM public.companies WHERE subdomain = 'main' LIMIT 1;

  -- Só inserir se realmente não existe
  INSERT INTO public.profiles (id, first_name, last_name, company_id)
  SELECT NEW.id, '', '', default_company_id
  WHERE NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.id);

  RETURN NEW;
END;
$$;

-- Recriar o trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE PROCEDURE public.handle_new_user();

-- Limpar dados inconsistentes
-- Remover perfis duplicados mantendo o mais recente
WITH duplicates AS (
  SELECT id, created_at,
         ROW_NUMBER() OVER (PARTITION BY id ORDER BY created_at DESC) as rn
  FROM public.profiles
)
DELETE FROM public.profiles 
WHERE (id, created_at) IN (
  SELECT id, created_at FROM duplicates WHERE rn > 1
);

-- Remover user_roles órfãos
DELETE FROM public.user_roles 
WHERE user_id NOT IN (SELECT id FROM public.profiles);

-- Sincronizar company_id entre profiles e user_roles
UPDATE public.profiles 
SET company_id = ur.company_id
FROM public.user_roles ur 
WHERE profiles.id = ur.user_id 
AND profiles.company_id != ur.company_id;
