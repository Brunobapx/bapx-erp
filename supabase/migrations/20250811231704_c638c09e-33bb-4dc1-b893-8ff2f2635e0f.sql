-- Per-company unique numbering for sales to fix duplicate sale_number across companies
-- 1) Drop old global unique constraint on sale_number
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE t.relname = 'sales'
      AND n.nspname = 'public'
      AND c.conname = 'sales_sale_number_key'
  ) THEN
    ALTER TABLE public.sales DROP CONSTRAINT sales_sale_number_key;
  END IF;
END $$;

-- 2) Create a per-company unique index for (company_id, sale_number)
-- Normalize NULL company_id to a sentinel to keep uniqueness guarantees even if trigger fails
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind = 'i'
      AND c.relname = 'uniq_sales_company_sale_number'
      AND n.nspname = 'public'
  ) THEN
    CREATE UNIQUE INDEX uniq_sales_company_sale_number
      ON public.sales ((COALESCE(company_id, '00000000-0000-0000-0000-000000000000'::uuid)), sale_number);
  END IF;
END $$;

-- 3) Reassert trigger order (Postgres runs BEFORE triggers in name order)
-- Ensure company_id is set before sale_number assignment
-- If triggers already exist, do nothing
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_sales_set_company_id') THEN
    CREATE TRIGGER trg_sales_set_company_id
    BEFORE INSERT ON public.sales
    FOR EACH ROW EXECUTE FUNCTION public.set_company_id();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_sales_set_sale_number') THEN
    CREATE TRIGGER trg_sales_set_sale_number
    BEFORE INSERT ON public.sales
    FOR EACH ROW EXECUTE FUNCTION public.set_sale_number();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_sales_update_updated_at') THEN
    CREATE TRIGGER trg_sales_update_updated_at
    BEFORE UPDATE ON public.sales
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- 4) Optional sanity backfill (should already be set, but keep it consistent)
UPDATE public.sales s
SET company_id = p.company_id
FROM public.profiles p
WHERE s.company_id IS NULL AND p.id = s.user_id;