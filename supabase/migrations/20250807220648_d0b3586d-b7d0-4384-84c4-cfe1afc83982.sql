-- 1) Companies and Profiles for multi-tenant SAAS
CREATE TABLE IF NOT EXISTS public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  subdomain TEXT,
  billing_email TEXT,
  logo_url TEXT,
  primary_color TEXT,
  secondary_color TEXT,
  onboarded_at TIMESTAMPTZ DEFAULT now(),
  trial_expires_at TIMESTAMPTZ
);

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins manage companies" ON public.companies;
CREATE POLICY "Admins manage companies"
ON public.companies
FOR ALL
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  company_id UUID REFERENCES public.companies(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (id = auth.uid());

-- 2) Helper functions for company checks
CREATE OR REPLACE FUNCTION public.current_user_company_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT company_id FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.validate_company_access(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  current_user_company uuid;
  target_user_company uuid;
BEGIN
  SELECT company_id INTO current_user_company FROM public.profiles WHERE id = auth.uid();
  SELECT company_id INTO target_user_company FROM public.profiles WHERE id = target_user_id;

  -- Backward-compatible behavior: if both missing, allow (legacy single-company)
  IF current_user_company IS NULL AND target_user_company IS NULL THEN
    RETURN TRUE;
  END IF;
  IF current_user_company IS NOT NULL AND target_user_company IS NOT NULL THEN
    RETURN current_user_company = target_user_company;
  END IF;
  RETURN FALSE;
END;
$$;

-- 3) Generic trigger to set company_id on insert
CREATE OR REPLACE FUNCTION public.set_company_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF NEW.company_id IS NULL THEN
    NEW.company_id := public.current_user_company_id();
  END IF;
  RETURN NEW;
END;
$$;

-- 4) Add company_id to global settings tables
ALTER TABLE public.payment_methods ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);
ALTER TABLE public.payment_terms ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);
ALTER TABLE public.financial_accounts ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);
ALTER TABLE public.financial_categories ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);
ALTER TABLE public.markup_settings ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);

CREATE INDEX IF NOT EXISTS idx_payment_methods_company_id ON public.payment_methods(company_id);
CREATE INDEX IF NOT EXISTS idx_payment_terms_company_id ON public.payment_terms(company_id);
CREATE INDEX IF NOT EXISTS idx_financial_accounts_company_id ON public.financial_accounts(company_id);
CREATE INDEX IF NOT EXISTS idx_financial_categories_company_id ON public.financial_categories(company_id);
CREATE INDEX IF NOT EXISTS idx_markup_settings_company_id ON public.markup_settings(company_id);

-- 5) Seed initial companies Bapx (01) and Artisan (02)
INSERT INTO public.companies (name, code, subdomain, onboarded_at)
VALUES ('Bapx Tecnologia', '01', 'bapx', now())
ON CONFLICT (code) DO NOTHING;
INSERT INTO public.companies (name, code, subdomain, onboarded_at)
VALUES ('Artisan', '02', 'artisan', now())
ON CONFLICT (code) DO NOTHING;

-- 6) Ensure profiles exist and assign existing users to Artisan (02)
INSERT INTO public.profiles (id, first_name, last_name, company_id)
SELECT au.id, NULL, NULL, c.id
FROM auth.users au
CROSS JOIN LATERAL (SELECT id FROM public.companies WHERE code = '02') c
ON CONFLICT (id) DO NOTHING;

UPDATE public.profiles p
SET company_id = c.id
FROM public.companies c
WHERE c.code = '02' AND p.company_id IS NULL;

-- 7) Backfill existing records to Artisan for new company-bound tables
DO $$
DECLARE artisan_id uuid;
BEGIN
  SELECT id INTO artisan_id FROM public.companies WHERE code = '02';
  UPDATE public.payment_methods SET company_id = COALESCE(company_id, artisan_id);
  UPDATE public.payment_terms SET company_id = COALESCE(company_id, artisan_id);
  UPDATE public.financial_accounts SET company_id = COALESCE(company_id, artisan_id);
  UPDATE public.financial_categories SET company_id = COALESCE(company_id, artisan_id);
  UPDATE public.markup_settings SET company_id = COALESCE(company_id, artisan_id);
END $$;

-- 8) Attach triggers to auto-fill company_id on inserts
DROP TRIGGER IF EXISTS set_company_id_payment_methods ON public.payment_methods;
CREATE TRIGGER set_company_id_payment_methods BEFORE INSERT ON public.payment_methods FOR EACH ROW EXECUTE FUNCTION public.set_company_id();

DROP TRIGGER IF EXISTS set_company_id_payment_terms ON public.payment_terms;
CREATE TRIGGER set_company_id_payment_terms BEFORE INSERT ON public.payment_terms FOR EACH ROW EXECUTE FUNCTION public.set_company_id();

DROP TRIGGER IF EXISTS set_company_id_financial_accounts ON public.financial_accounts;
CREATE TRIGGER set_company_id_financial_accounts BEFORE INSERT ON public.financial_accounts FOR EACH ROW EXECUTE FUNCTION public.set_company_id();

DROP TRIGGER IF EXISTS set_company_id_financial_categories ON public.financial_categories;
CREATE TRIGGER set_company_id_financial_categories BEFORE INSERT ON public.financial_categories FOR EACH ROW EXECUTE FUNCTION public.set_company_id();

DROP TRIGGER IF EXISTS set_company_id_markup_settings ON public.markup_settings;
CREATE TRIGGER set_company_id_markup_settings BEFORE INSERT ON public.markup_settings FOR EACH ROW EXECUTE FUNCTION public.set_company_id();

-- 9) Tighten RLS to company scope on settings-like tables
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.markup_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can manage payment methods" ON public.payment_methods;
CREATE POLICY "Company can manage payment methods"
ON public.payment_methods
FOR ALL
USING (company_id = public.current_user_company_id())
WITH CHECK (company_id = public.current_user_company_id());

DROP POLICY IF EXISTS "Authenticated users can manage payment terms" ON public.payment_terms;
CREATE POLICY "Company can manage payment terms"
ON public.payment_terms
FOR ALL
USING (company_id = public.current_user_company_id())
WITH CHECK (company_id = public.current_user_company_id());

DROP POLICY IF EXISTS "Authenticated users can manage financial accounts" ON public.financial_accounts;
CREATE POLICY "Company can manage financial accounts"
ON public.financial_accounts
FOR ALL
USING (company_id = public.current_user_company_id())
WITH CHECK (company_id = public.current_user_company_id());

DROP POLICY IF EXISTS "Authenticated users can manage financial categories" ON public.financial_categories;
CREATE POLICY "Company can manage financial categories"
ON public.financial_categories
FOR ALL
USING (company_id = public.current_user_company_id())
WITH CHECK (company_id = public.current_user_company_id());

DROP POLICY IF EXISTS "Authenticated users can manage markup settings" ON public.markup_settings;
CREATE POLICY "Company can manage markup settings"
ON public.markup_settings
FOR ALL
USING (company_id = public.current_user_company_id())
WITH CHECK (company_id = public.current_user_company_id());
