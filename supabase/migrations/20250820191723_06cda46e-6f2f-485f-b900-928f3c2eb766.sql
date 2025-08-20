-- Criar tabela para orçamentos
CREATE TABLE public.quotes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_number TEXT NOT NULL DEFAULT '',
  client_id UUID NOT NULL,
  client_name TEXT NOT NULL,
  client_email TEXT,
  client_phone TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  valid_until DATE NOT NULL,
  payment_method TEXT,
  payment_term TEXT,
  notes TEXT,
  discount_percentage NUMERIC DEFAULT 0,
  discount_amount NUMERIC DEFAULT 0,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_id UUID NOT NULL,
  company_id UUID NOT NULL DEFAULT current_user_company_id()
);

-- Criar tabela para itens do orçamento
CREATE TABLE public.quote_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_id UUID NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  product_id UUID NOT NULL,
  product_name TEXT NOT NULL,
  description TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  total_price NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_id UUID NOT NULL,
  company_id UUID NOT NULL DEFAULT current_user_company_id()
);

-- Habilitar RLS
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_items ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS para quotes
CREATE POLICY "Company isolation" ON public.quotes
  FOR ALL USING (company_id = current_user_company_id())
  WITH CHECK (company_id = current_user_company_id());

-- Criar políticas RLS para quote_items
CREATE POLICY "Company isolation" ON public.quote_items
  FOR ALL USING (company_id = current_user_company_id())
  WITH CHECK (company_id = current_user_company_id());

-- Criar triggers para updated_at
CREATE TRIGGER update_quotes_updated_at
  BEFORE UPDATE ON public.quotes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_quote_items_updated_at
  BEFORE UPDATE ON public.quote_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Criar triggers para company_id
CREATE TRIGGER set_quotes_company_id
  BEFORE INSERT ON public.quotes
  FOR EACH ROW
  EXECUTE FUNCTION public.set_company_id();

CREATE TRIGGER set_quote_items_company_id
  BEFORE INSERT ON public.quote_items
  FOR EACH ROW
  EXECUTE FUNCTION public.set_company_id();

-- Criar função para gerar número do orçamento
CREATE OR REPLACE FUNCTION public.set_quote_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  IF NEW.quote_number IS NULL OR NEW.quote_number = '' THEN
    NEW.quote_number := public.generate_sequence_number('ORC', 'quotes', NEW.user_id);
  END IF;
  RETURN NEW;
END;
$function$;

-- Criar trigger para número do orçamento
CREATE TRIGGER set_quote_number_trigger
  BEFORE INSERT ON public.quotes
  FOR EACH ROW
  EXECUTE FUNCTION public.set_quote_number();