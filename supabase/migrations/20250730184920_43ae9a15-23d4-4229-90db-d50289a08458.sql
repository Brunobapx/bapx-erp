-- Criar tabela service_orders
CREATE TABLE public.service_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  os_number TEXT UNIQUE,
  opened_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  client_id UUID NOT NULL,
  technician_id UUID NOT NULL,
  service_type TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'Média',
  status TEXT NOT NULL DEFAULT 'Aberta',
  contract_service BOOLEAN NOT NULL DEFAULT false,
  service_value NUMERIC(10,2) DEFAULT 0,
  total_value NUMERIC(10,2) DEFAULT 0,
  notes TEXT,
  receivable_id UUID,
  company_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.service_orders ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS
CREATE POLICY "Users can view their company service orders" 
ON public.service_orders 
FOR SELECT 
USING (company_id IN (SELECT company_id FROM public.user_companies WHERE user_id = auth.uid()));

CREATE POLICY "Users can create service orders for their company" 
ON public.service_orders 
FOR INSERT 
WITH CHECK (company_id IN (SELECT company_id FROM public.user_companies WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their company service orders" 
ON public.service_orders 
FOR UPDATE 
USING (company_id IN (SELECT company_id FROM public.user_companies WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete their company service orders" 
ON public.service_orders 
FOR DELETE 
USING (company_id IN (SELECT company_id FROM public.user_companies WHERE user_id = auth.uid()));

-- Criar trigger para atualizar updated_at
CREATE TRIGGER update_service_orders_updated_at
BEFORE UPDATE ON public.service_orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Criar função para gerar número da OS
CREATE OR REPLACE FUNCTION public.set_os_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.os_number IS NULL OR NEW.os_number = '' THEN
    NEW.os_number := generate_sequence_number('OS', 'service_orders', NEW.company_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para gerar número da OS
CREATE TRIGGER set_service_order_number
BEFORE INSERT ON public.service_orders
FOR EACH ROW
EXECUTE FUNCTION public.set_os_number();

-- Criar tabela service_order_materials
CREATE TABLE public.service_order_materials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_order_id UUID NOT NULL REFERENCES public.service_orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL,
  quantity NUMERIC(10,2) NOT NULL,
  unit_value NUMERIC(10,2),
  subtotal NUMERIC(10,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS para materiais
ALTER TABLE public.service_order_materials ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS para materiais
CREATE POLICY "Users can view service order materials" 
ON public.service_order_materials 
FOR SELECT 
USING (service_order_id IN (
  SELECT id FROM public.service_orders 
  WHERE company_id IN (SELECT company_id FROM public.user_companies WHERE user_id = auth.uid())
));

CREATE POLICY "Users can create service order materials" 
ON public.service_order_materials 
FOR INSERT 
WITH CHECK (service_order_id IN (
  SELECT id FROM public.service_orders 
  WHERE company_id IN (SELECT company_id FROM public.user_companies WHERE user_id = auth.uid())
));

CREATE POLICY "Users can update service order materials" 
ON public.service_order_materials 
FOR UPDATE 
USING (service_order_id IN (
  SELECT id FROM public.service_orders 
  WHERE company_id IN (SELECT company_id FROM public.user_companies WHERE user_id = auth.uid())
));

CREATE POLICY "Users can delete service order materials" 
ON public.service_order_materials 
FOR DELETE 
USING (service_order_id IN (
  SELECT id FROM public.service_orders 
  WHERE company_id IN (SELECT company_id FROM public.user_companies WHERE user_id = auth.uid())
));