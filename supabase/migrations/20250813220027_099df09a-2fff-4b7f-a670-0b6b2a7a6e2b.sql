-- Isolar configurações fiscais por empresa
-- Adicionar company_id à tabela system_settings se não existir
DO $$
BEGIN
  -- Verificar se a coluna company_id já existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'system_settings' 
    AND column_name = 'company_id'
  ) THEN
    ALTER TABLE public.system_settings ADD COLUMN company_id uuid;
  END IF;
END $$;

-- Habilitar RLS na tabela system_settings
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Criar política de isolamento por empresa para system_settings
DO $$
BEGIN
  BEGIN
    EXECUTE 'CREATE POLICY system_settings_company_access ON public.system_settings
             FOR ALL
             USING (company_id = current_user_company_id())
             WITH CHECK (company_id = current_user_company_id())';
  EXCEPTION
    WHEN duplicate_object THEN
      -- Política já existe
      NULL;
  END;
END $$;

-- Criar trigger para definir company_id automaticamente
DO $$
BEGIN
  BEGIN
    CREATE TRIGGER set_system_settings_company_id
      BEFORE INSERT ON public.system_settings
      FOR EACH ROW
      EXECUTE FUNCTION public.set_company_id();
  EXCEPTION
    WHEN duplicate_object THEN
      -- Trigger já existe
      NULL;
  END;
END $$;