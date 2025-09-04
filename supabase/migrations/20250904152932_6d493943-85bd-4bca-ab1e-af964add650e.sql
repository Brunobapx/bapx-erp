-- Add company management fields and e-commerce specific settings
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS cnpj TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS razao_social TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS inscricao_estadual TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS endereco TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS cidade TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS estado TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS cep TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS telefone TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS website TEXT;

-- E-commerce specific settings
CREATE TABLE IF NOT EXISTS public.company_ecommerce_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  store_name TEXT NOT NULL DEFAULT 'Minha Loja',
  store_description TEXT,
  store_logo_url TEXT,
  mercado_pago_access_token TEXT,
  mercado_pago_public_key TEXT,
  shipping_settings JSONB DEFAULT '{"free_shipping_min": 100, "default_shipping": 15.90}',
  payment_methods JSONB DEFAULT '["credit_card", "pix", "boleto"]',
  is_active BOOLEAN DEFAULT false,
  custom_domain TEXT,
  theme_settings JSONB DEFAULT '{"primary_color": "#0066cc", "secondary_color": "#ffffff"}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(company_id)
);

-- Enable RLS
ALTER TABLE public.company_ecommerce_settings ENABLE ROW LEVEL SECURITY;

-- Create policy for company e-commerce settings
CREATE POLICY "Company can manage their e-commerce settings" ON public.company_ecommerce_settings
  FOR ALL USING (company_id = current_user_company_id());

-- Create triggers for updated_at
CREATE TRIGGER update_company_ecommerce_settings_updated_at
  BEFORE UPDATE ON public.company_ecommerce_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Company transfer/migration table for audit
CREATE TABLE IF NOT EXISTS public.company_transfers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  from_company_id UUID REFERENCES public.companies(id),
  to_company_id UUID REFERENCES public.companies(id),
  user_id UUID NOT NULL,
  transfer_type TEXT NOT NULL, -- 'user_transfer', 'data_migration', 'company_merge'
  transferred_data JSONB, -- What data was transferred
  status TEXT DEFAULT 'pending', -- pending, completed, failed
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT
);

-- Enable RLS for company transfers
ALTER TABLE public.company_transfers ENABLE ROW LEVEL SECURITY;

-- Only admins can see transfers
CREATE POLICY "Admins can manage company transfers" ON public.company_transfers
  FOR ALL USING (is_admin(auth.uid()));