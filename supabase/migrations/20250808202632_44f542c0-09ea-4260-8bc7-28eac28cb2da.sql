BEGIN;

-- Drop legacy global unique constraint on key only
ALTER TABLE public.system_settings
  DROP CONSTRAINT IF EXISTS system_settings_key_key;

-- Ensure composite uniqueness per company and key
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'system_settings_company_key_unique'
  ) THEN
    ALTER TABLE public.system_settings
      ADD CONSTRAINT system_settings_company_key_unique UNIQUE (company_id, key);
  END IF;
END $$;

-- Helpful index
CREATE INDEX IF NOT EXISTS idx_system_settings_company_key ON public.system_settings (company_id, key);

COMMIT;