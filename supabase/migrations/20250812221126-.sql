-- Ensure vendors are isolated per company via RLS
DO $$
BEGIN
  IF to_regclass('public.vendors') IS NULL THEN
    RAISE NOTICE 'Table public.vendors does not exist; skipping RLS setup.';
  ELSE
    -- Enable RLS
    EXECUTE 'ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY';

    -- Create a single company isolation policy (idempotent)
    BEGIN
      EXECUTE 'CREATE POLICY vendors_company_access ON public.vendors
               FOR ALL
               USING (validate_company_access(user_id))
               WITH CHECK (validate_company_access(user_id))';
    EXCEPTION
      WHEN duplicate_object THEN
        -- Policy already exists
        NULL;
    END;
  END IF;
END
$$;