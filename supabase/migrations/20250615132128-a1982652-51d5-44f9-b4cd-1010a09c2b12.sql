
-- Cria tabela de configurações padrão de markup para cada empresa
CREATE TABLE public.markup_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  fixed_expenses_percentage NUMERIC NOT NULL DEFAULT 0,
  variable_expenses_percentage NUMERIC NOT NULL DEFAULT 0,
  default_profit_margin NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilita RLS
ALTER TABLE public.markup_settings ENABLE ROW LEVEL SECURITY;

-- Permitir SELECT, UPDATE, DELETE apenas se company_id do registro bater com a empresa do usuário logado
CREATE POLICY "Organizations can view their markup_settings"
  ON public.markup_settings
  FOR SELECT
  USING (company_id = get_current_user_company_id());

CREATE POLICY "Organizations can update their markup_settings"
  ON public.markup_settings
  FOR UPDATE
  USING (company_id = get_current_user_company_id());

CREATE POLICY "Organizations can delete their markup_settings"
  ON public.markup_settings
  FOR DELETE
  USING (company_id = get_current_user_company_id());

CREATE POLICY "Organizations can insert their markup_settings"
  ON public.markup_settings
  FOR INSERT
  WITH CHECK (company_id = get_current_user_company_id());
