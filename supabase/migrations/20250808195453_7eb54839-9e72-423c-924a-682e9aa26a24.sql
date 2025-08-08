BEGIN;

-- 1) Add company_id column to packaging (if missing)
ALTER TABLE public.packaging
  ADD COLUMN IF NOT EXISTS company_id uuid;

-- 2) Temporarily disable triggers to allow safe backfill
ALTER TABLE public.packaging DISABLE TRIGGER ALL;

-- 3) Backfill company_id from profiles based on user_id
UPDATE public.packaging p
SET company_id = pr.company_id
FROM public.profiles pr
WHERE p.company_id IS NULL AND pr.id = p.user_id;

-- 4) Re-enable triggers
ALTER TABLE public.packaging ENABLE TRIGGER ALL;

-- 5) Ensure company_id is auto-set on new rows
DROP TRIGGER IF EXISTS set_packaging_company_id ON public.packaging;
CREATE TRIGGER set_packaging_company_id
BEFORE INSERT ON public.packaging
FOR EACH ROW EXECUTE FUNCTION public.set_company_id();

-- 6) Replace global unique constraint with per-company uniqueness
ALTER TABLE public.packaging DROP CONSTRAINT IF EXISTS packaging_packaging_number_key;
ALTER TABLE public.packaging ADD CONSTRAINT packaging_company_number_unique UNIQUE (company_id, packaging_number);

-- 7) Optional index to keep fast lookups by packaging_number within company
CREATE INDEX IF NOT EXISTS idx_packaging_company_number ON public.packaging (company_id, packaging_number);

COMMIT;