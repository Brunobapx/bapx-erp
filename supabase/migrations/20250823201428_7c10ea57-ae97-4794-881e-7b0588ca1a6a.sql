-- Criar tabela de operações fiscais
CREATE TABLE IF NOT EXISTS public.fiscal_operations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL,
  user_id uuid NOT NULL,
  operation_type text NOT NULL CHECK (operation_type IN ('venda', 'devolucao', 'transferencia', 'remessa', 'retorno')),
  cfop text NOT NULL,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT unique_operation_per_company UNIQUE (company_id, operation_type)
);

-- Habilitar RLS na tabela fiscal_operations
ALTER TABLE public.fiscal_operations ENABLE ROW LEVEL SECURITY;

-- Criar política RLS para isolamento por empresa
CREATE POLICY "Company isolation" ON public.fiscal_operations
  FOR ALL
  USING (company_id = current_user_company_id())
  WITH CHECK (company_id = current_user_company_id());

-- Criar trigger para atualizar updated_at
CREATE TRIGGER update_fiscal_operations_updated_at
  BEFORE UPDATE ON public.fiscal_operations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Criar tabela de regras de cálculo de impostos
CREATE TABLE IF NOT EXISTS public.tax_calculation_rules (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL,
  user_id uuid NOT NULL,
  rule_name text NOT NULL,
  regime_tributario text NOT NULL CHECK (regime_tributario IN ('simples_nacional', 'lucro_presumido', 'lucro_real')),
  icms_rate numeric DEFAULT 0,
  ipi_rate numeric DEFAULT 0,
  pis_rate numeric DEFAULT 1.65,
  cofins_rate numeric DEFAULT 7.6,
  csosn text,
  cst text,
  cfop_default text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Habilitar RLS na tabela tax_calculation_rules
ALTER TABLE public.tax_calculation_rules ENABLE ROW LEVEL SECURITY;

-- Criar política RLS para isolamento por empresa
CREATE POLICY "Company isolation" ON public.tax_calculation_rules
  FOR ALL
  USING (company_id = current_user_company_id())
  WITH CHECK (company_id = current_user_company_id());

-- Criar trigger para atualizar updated_at
CREATE TRIGGER update_tax_calculation_rules_updated_at
  BEFORE UPDATE ON public.tax_calculation_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir operações fiscais padrão para empresas existentes que tenham usuários
INSERT INTO public.fiscal_operations (company_id, user_id, operation_type, cfop, description)
SELECT DISTINCT 
  p.company_id, 
  p.id as user_id, 
  'venda' as operation_type, 
  '5101' as cfop, 
  'Venda de mercadorias'
FROM public.profiles p 
WHERE p.company_id IS NOT NULL
ON CONFLICT (company_id, operation_type) DO NOTHING;

INSERT INTO public.fiscal_operations (company_id, user_id, operation_type, cfop, description)
SELECT DISTINCT 
  p.company_id, 
  p.id as user_id, 
  'devolucao' as operation_type, 
  '1202' as cfop, 
  'Devolução de vendas'
FROM public.profiles p 
WHERE p.company_id IS NOT NULL
ON CONFLICT (company_id, operation_type) DO NOTHING;