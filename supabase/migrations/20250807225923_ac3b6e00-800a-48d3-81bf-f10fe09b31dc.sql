-- Add SaaS-specific fields to companies
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS whatsapp text,
  ADD COLUMN IF NOT EXISTS plan text;

-- Optional: index for plan filtering later
CREATE INDEX IF NOT EXISTS idx_companies_plan ON public.companies (plan);