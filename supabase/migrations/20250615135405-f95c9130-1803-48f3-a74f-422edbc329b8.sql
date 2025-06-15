
-- 1. Tabela para Categorias de Lançamento Financeiro
CREATE TABLE public.financial_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('receita', 'despesa')),
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Tabela para Contas Bancárias/Caixa
CREATE TABLE public.financial_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  name TEXT NOT NULL,
  account_type TEXT NOT NULL CHECK (account_type IN ('corrente', 'poupanca', 'caixa')),
  bank TEXT,
  agency TEXT,
  account_number TEXT,
  initial_balance NUMERIC DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Tabela para Formas de Pagamento
CREATE TABLE public.payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. Tabela para Prazos de Pagamento
CREATE TABLE public.payment_terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  name TEXT NOT NULL,
  days INTEGER NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilita RLS e define políticas para cada tabela

-- financial_categories
ALTER TABLE public.financial_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Empresas podem ver as próprias categorias" ON public.financial_categories FOR SELECT USING (company_id = get_current_user_company_id());
CREATE POLICY "Empresas podem inserir suas categorias" ON public.financial_categories FOR INSERT WITH CHECK (company_id = get_current_user_company_id());
CREATE POLICY "Empresas podem atualizar suas categorias" ON public.financial_categories FOR UPDATE USING (company_id = get_current_user_company_id());
CREATE POLICY "Empresas podem deletar suas categorias" ON public.financial_categories FOR DELETE USING (company_id = get_current_user_company_id());

-- financial_accounts
ALTER TABLE public.financial_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Empresas podem ver as próprias contas" ON public.financial_accounts FOR SELECT USING (company_id = get_current_user_company_id());
CREATE POLICY "Empresas podem inserir suas contas" ON public.financial_accounts FOR INSERT WITH CHECK (company_id = get_current_user_company_id());
CREATE POLICY "Empresas podem atualizar suas contas" ON public.financial_accounts FOR UPDATE USING (company_id = get_current_user_company_id());
CREATE POLICY "Empresas podem deletar suas contas" ON public.financial_accounts FOR DELETE USING (company_id = get_current_user_company_id());

-- payment_methods
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Empresas podem ver os próprios métodos" ON public.payment_methods FOR SELECT USING (company_id = get_current_user_company_id());
CREATE POLICY "Empresas podem inserir seus métodos" ON public.payment_methods FOR INSERT WITH CHECK (company_id = get_current_user_company_id());
CREATE POLICY "Empresas podem atualizar seus métodos" ON public.payment_methods FOR UPDATE USING (company_id = get_current_user_company_id());
CREATE POLICY "Empresas podem deletar seus métodos" ON public.payment_methods FOR DELETE USING (company_id = get_current_user_company_id());

-- payment_terms
ALTER TABLE public.payment_terms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Empresas podem ver os próprios prazos" ON public.payment_terms FOR SELECT USING (company_id = get_current_user_company_id());
CREATE POLICY "Empresas podem inserir seus prazos" ON public.payment_terms FOR INSERT WITH CHECK (company_id = get_current_user_company_id());
CREATE POLICY "Empresas podem atualizar seus prazos" ON public.payment_terms FOR UPDATE USING (company_id = get_current_user_company_id());
CREATE POLICY "Empresas podem deletar seus prazos" ON public.payment_terms FOR DELETE USING (company_id = get_current_user_company_id());
