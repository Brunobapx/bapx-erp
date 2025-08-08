BEGIN;

-- 1) system_settings: make settings multi-tenant by company
ALTER TABLE public.system_settings
  ADD COLUMN IF NOT EXISTS company_id uuid;

-- Auto-set company_id on insert
DROP TRIGGER IF EXISTS set_system_settings_company_id ON public.system_settings;
CREATE TRIGGER set_system_settings_company_id
BEFORE INSERT ON public.system_settings
FOR EACH ROW EXECUTE FUNCTION public.set_company_id();

-- Enable RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Replace policy with company-scoped access
DROP POLICY IF EXISTS "Company can manage system settings" ON public.system_settings;
CREATE POLICY "Company can manage system settings"
ON public.system_settings
FOR ALL
USING (company_id = public.current_user_company_id())
WITH CHECK (company_id = public.current_user_company_id());

-- Uniqueness per company and key
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'system_settings_company_key_unique'
  ) THEN
    ALTER TABLE public.system_settings
      ADD CONSTRAINT system_settings_company_key_unique UNIQUE (company_id, key);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_system_settings_company_key ON public.system_settings (company_id, key);

-- 2) nota_configuracoes: company-scoped NF-e config
ALTER TABLE public.nota_configuracoes
  ADD COLUMN IF NOT EXISTS company_id uuid;

-- Backfill company_id from profiles via user_id
UPDATE public.nota_configuracoes nc
SET company_id = pr.company_id
FROM public.profiles pr
WHERE nc.company_id IS NULL AND pr.id = nc.user_id;

-- Auto-set company_id on insert
DROP TRIGGER IF EXISTS set_nota_config_company_id ON public.nota_configuracoes;
CREATE TRIGGER set_nota_config_company_id
BEFORE INSERT ON public.nota_configuracoes
FOR EACH ROW EXECUTE FUNCTION public.set_company_id();

-- Replace RLS policies to company scope
DROP POLICY IF EXISTS "Users can manage their own nota configurations" ON public.nota_configuracoes;

CREATE POLICY "Company can select nota_configuracoes"
ON public.nota_configuracoes
FOR SELECT
USING (public.validate_company_access(user_id));

CREATE POLICY "Company can insert nota_configuracoes"
ON public.nota_configuracoes
FOR INSERT
WITH CHECK (public.validate_company_access(user_id));

CREATE POLICY "Company can update nota_configuracoes"
ON public.nota_configuracoes
FOR UPDATE
USING (public.validate_company_access(user_id))
WITH CHECK (public.validate_company_access(user_id));

CREATE POLICY "Company can delete nota_configuracoes"
ON public.nota_configuracoes
FOR DELETE
USING (public.validate_company_access(user_id));

-- Ensure one config per company per tipo_nota
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'nota_configuracoes_company_tipo_unique'
  ) THEN
    ALTER TABLE public.nota_configuracoes
      ADD CONSTRAINT nota_configuracoes_company_tipo_unique UNIQUE (company_id, tipo_nota);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_nota_configuracoes_company_tipo ON public.nota_configuracoes (company_id, tipo_nota);

COMMIT;