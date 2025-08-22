-- Criar tabela para CFOPs por operação
CREATE TABLE IF NOT EXISTS public.fiscal_operations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  operation_type text NOT NULL, -- 'venda', 'devolucao', 'bonificacao', 'transferencia', etc.
  operation_name text NOT NULL,
  cfop_dentro_estado text NOT NULL, -- CFOP para dentro do estado
  cfop_fora_estado text NOT NULL,   -- CFOP para fora do estado
  cfop_exterior text,               -- CFOP para exterior (opcional)
  description text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT unique_operation_per_company UNIQUE(company_id, operation_type)
);

-- Inserir operações padrão para empresas existentes
INSERT INTO public.fiscal_operations (company_id, user_id, operation_type, operation_name, cfop_dentro_estado, cfop_fora_estado, cfop_exterior, description)
SELECT 
  c.id as company_id,
  p.id as user_id,
  'venda' as operation_type,
  'Venda de Mercadoria' as operation_name,
  '5102' as cfop_dentro_estado,
  '6102' as cfop_fora_estado,
  '7102' as cfop_exterior,
  'Venda de mercadoria adquirida ou recebida de terceiros' as description
FROM public.companies c
JOIN public.profiles p ON p.company_id = c.id
WHERE NOT EXISTS (
  SELECT 1 FROM public.fiscal_operations fo 
  WHERE fo.company_id = c.id AND fo.operation_type = 'venda'
);

INSERT INTO public.fiscal_operations (company_id, user_id, operation_type, operation_name, cfop_dentro_estado, cfop_fora_estado, cfop_exterior, description)
SELECT 
  c.id as company_id,
  p.id as user_id,
  'devolucao' as operation_type,
  'Devolução de Venda' as operation_name,
  '1202' as cfop_dentro_estado,
  '2202' as cfop_fora_estado,
  '3202' as cfop_exterior,
  'Devolução de venda de mercadoria adquirida ou recebida de terceiros' as description
FROM public.companies c
JOIN public.profiles p ON p.company_id = c.id
WHERE NOT EXISTS (
  SELECT 1 FROM public.fiscal_operations fo 
  WHERE fo.company_id = c.id AND fo.operation_type = 'devolucao'
);

INSERT INTO public.fiscal_operations (company_id, user_id, operation_type, operation_name, cfop_dentro_estado, cfop_fora_estado, description)
SELECT 
  c.id as company_id,
  p.id as user_id,
  'bonificacao' as operation_type,
  'Bonificação' as operation_name,
  '5910' as cfop_dentro_estado,
  '6910' as cfop_fora_estado,
  'Bonificação - entrega gratuita de mercadoria' as description
FROM public.companies c
JOIN public.profiles p ON p.company_id = c.id
WHERE NOT EXISTS (
  SELECT 1 FROM public.fiscal_operations fo 
  WHERE fo.company_id = c.id AND fo.operation_type = 'bonificacao'
);

INSERT INTO public.fiscal_operations (company_id, user_id, operation_type, operation_name, cfop_dentro_estado, cfop_fora_estado, description)
SELECT 
  c.id as company_id,
  p.id as user_id,
  'transferencia' as operation_type,
  'Transferência' as operation_name,
  '5152' as cfop_dentro_estado,
  '6152' as cfop_fora_estado,
  'Transferência de mercadoria adquirida ou recebida de terceiros' as description
FROM public.companies c
JOIN public.profiles p ON p.company_id = c.id
WHERE NOT EXISTS (
  SELECT 1 FROM public.fiscal_operations fo 
  WHERE fo.company_id = c.id AND fo.operation_type = 'transferencia'
);

-- RLS policies para fiscal_operations
ALTER TABLE public.fiscal_operations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company can manage fiscal operations" ON public.fiscal_operations
  FOR ALL USING (company_id = current_user_company_id())
  WITH CHECK (company_id = current_user_company_id());

-- Trigger para atualizar updated_at
CREATE TRIGGER update_fiscal_operations_updated_at
  BEFORE UPDATE ON public.fiscal_operations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Criar tabela para regras de cálculo de impostos
CREATE TABLE IF NOT EXISTS public.tax_calculation_rules (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  rule_name text NOT NULL,
  tax_regime text NOT NULL, -- 'simples_nacional', 'lucro_presumido', 'lucro_real', 'mei'
  apply_to text NOT NULL, -- 'all_products', 'by_category', 'by_ncm'
  filter_value text, -- categoria ou NCM específico
  
  -- Regras ICMS
  icms_cst text DEFAULT '60',
  icms_aliquota numeric DEFAULT 18,
  icms_reducao_base numeric DEFAULT 0,
  
  -- Regras PIS
  pis_cst text DEFAULT '01',
  pis_aliquota numeric DEFAULT 1.65,
  
  -- Regras COFINS  
  cofins_cst text DEFAULT '01',
  cofins_aliquota numeric DEFAULT 7.6,
  
  -- Regras IPI
  ipi_cst text DEFAULT '50',
  ipi_aliquota numeric DEFAULT 0,
  
  is_active boolean DEFAULT true,
  priority_order integer DEFAULT 1, -- ordem de prioridade das regras
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- RLS policies para tax_calculation_rules
ALTER TABLE public.tax_calculation_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company can manage tax calculation rules" ON public.tax_calculation_rules
  FOR ALL USING (company_id = current_user_company_id())
  WITH CHECK (company_id = current_user_company_id());

-- Trigger para atualizar updated_at
CREATE TRIGGER update_tax_calculation_rules_updated_at
  BEFORE UPDATE ON public.tax_calculation_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir regras padrão baseadas no regime tributário atual
INSERT INTO public.tax_calculation_rules (
  company_id, user_id, rule_name, tax_regime, apply_to,
  icms_cst, icms_aliquota, pis_cst, pis_aliquota, cofins_cst, cofins_aliquota
)
SELECT 
  c.id as company_id,
  p.id as user_id,
  'Regra Padrão - Regime Normal' as rule_name,
  'lucro_presumido' as tax_regime,
  'all_products' as apply_to,
  '60' as icms_cst,
  18 as icms_aliquota,
  '01' as pis_cst,
  1.65 as pis_aliquota,
  '01' as cofins_cst,
  7.6 as cofins_aliquota
FROM public.companies c
JOIN public.profiles p ON p.company_id = c.id
WHERE NOT EXISTS (
  SELECT 1 FROM public.tax_calculation_rules tcr 
  WHERE tcr.company_id = c.id
);