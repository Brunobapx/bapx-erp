
-- Corrige função para NÃO sobrescrever o company_id, apenas insere se não estiver preenchido
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  default_company_id UUID;
BEGIN
  -- Se já houver company_id definido, não insere novo perfil
  IF NEW.company_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Se não houver company_id, define para o padrão (main)
  SELECT id INTO default_company_id FROM public.companies WHERE subdomain = 'main' LIMIT 1;

  INSERT INTO public.profiles (id, first_name, last_name, company_id)
  VALUES (NEW.id, '', '', default_company_id);

  RETURN NEW;
END;
$$;

-- O trigger associado continua o mesmo
-- O resto da regra de negócio permanece inalterado

