-- Criar tabela para armazenar notas fiscais emitidas
CREATE TABLE public.fiscal_invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  sale_id UUID REFERENCES public.sales(id),
  order_id UUID REFERENCES public.orders(id),
  client_id UUID REFERENCES public.clients(id),
  
  -- Dados da NFe
  invoice_number TEXT NOT NULL,
  invoice_key TEXT, -- Chave de acesso da NFe (44 dígitos)
  protocol_number TEXT, -- Número do protocolo SEFAZ
  invoice_type TEXT NOT NULL DEFAULT 'NFe', -- NFe, NFCe, CTe
  series_number INTEGER DEFAULT 1,
  
  -- Status e datas
  status TEXT NOT NULL DEFAULT 'pending', -- pending, authorized, rejected, cancelled
  issue_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  authorization_date TIMESTAMP WITH TIME ZONE,
  
  -- Valores
  total_amount NUMERIC NOT NULL,
  tax_amount NUMERIC DEFAULT 0,
  
  -- Dados do Focus NFe
  focus_reference TEXT, -- Referência no Focus NFe
  focus_status TEXT, -- Status retornado pelo Focus NFe
  focus_message TEXT, -- Mensagem de retorno
  focus_response JSONB, -- Resposta completa do Focus NFe
  
  -- URLs dos arquivos
  danfe_url TEXT, -- URL do PDF do DANFE
  xml_url TEXT, -- URL do XML da NFe
  
  -- Observações
  observations TEXT,
  error_message TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.fiscal_invoices ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Authenticated users can manage all fiscal invoices" 
ON public.fiscal_invoices 
FOR ALL 
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Índices para performance
CREATE INDEX idx_fiscal_invoices_user_id ON public.fiscal_invoices(user_id);
CREATE INDEX idx_fiscal_invoices_sale_id ON public.fiscal_invoices(sale_id);
CREATE INDEX idx_fiscal_invoices_status ON public.fiscal_invoices(status);
CREATE INDEX idx_fiscal_invoices_issue_date ON public.fiscal_invoices(issue_date DESC);
CREATE INDEX idx_fiscal_invoices_invoice_key ON public.fiscal_invoices(invoice_key);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_fiscal_invoices_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_fiscal_invoices_updated_at
  BEFORE UPDATE ON public.fiscal_invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_fiscal_invoices_updated_at();