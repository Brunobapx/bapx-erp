-- Sales per-company isolation and numbering
-- 1) Add company_id column if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'sales' AND column_name = 'company_id'
  ) THEN
    ALTER TABLE public.sales ADD COLUMN company_id uuid;
  END IF;
END $$;

-- 2) Backfill company_id from profiles based on user_id
UPDATE public.sales s
SET company_id = p.company_id
FROM public.profiles p
WHERE s.company_id IS NULL AND p.id = s.user_id;

-- 3) Create index on company_id for performance
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind = 'i'
      AND c.relname = 'idx_sales_company_id'
      AND n.nspname = 'public'
  ) THEN
    CREATE INDEX idx_sales_company_id ON public.sales (company_id);
  END IF;
END $$;

-- 4) Ensure triggers exist to set company_id, sale_number and keep updated_at
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_sales_set_company_id') THEN
    CREATE TRIGGER trg_sales_set_company_id
    BEFORE INSERT ON public.sales
    FOR EACH ROW EXECUTE FUNCTION public.set_company_id();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_sales_set_sale_number') THEN
    CREATE TRIGGER trg_sales_set_sale_number
    BEFORE INSERT ON public.sales
    FOR EACH ROW EXECUTE FUNCTION public.set_sale_number();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_sales_update_updated_at') THEN
    CREATE TRIGGER trg_sales_update_updated_at
    BEFORE UPDATE ON public.sales
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;