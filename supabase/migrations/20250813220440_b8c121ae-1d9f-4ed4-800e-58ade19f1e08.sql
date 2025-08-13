-- Verificar e ajustar a estrutura da tabela system_settings para isolamento por empresa
-- Primeiro, verificar se existe constraint única em (company_id, key)
DO $$
BEGIN
  -- Criar constraint única se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'system_settings_company_key_unique' 
    AND table_name = 'system_settings'
  ) THEN
    ALTER TABLE public.system_settings 
    ADD CONSTRAINT system_settings_company_key_unique 
    UNIQUE (company_id, key);
  END IF;
END $$;

-- Garantir que user_id não seja nulo para novos registros
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'system_settings' 
    AND column_name = 'user_id' 
    AND is_nullable = 'YES'
  ) THEN
    -- Atualizar registros existentes sem user_id
    UPDATE public.system_settings 
    SET user_id = (SELECT id FROM auth.users LIMIT 1)
    WHERE user_id IS NULL;
    
    -- Tornar user_id NOT NULL
    ALTER TABLE public.system_settings ALTER COLUMN user_id SET NOT NULL;
  END IF;
END $$;