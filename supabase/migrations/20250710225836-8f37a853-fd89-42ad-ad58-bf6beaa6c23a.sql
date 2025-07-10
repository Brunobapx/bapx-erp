-- Criar tabela para configurações de comissão por vendedor
CREATE TABLE public.seller_commissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  commission_type TEXT NOT NULL DEFAULT 'percentage' CHECK (commission_type IN ('percentage', 'fixed')),
  commission_value NUMERIC NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Habilitar RLS
ALTER TABLE public.seller_commissions ENABLE ROW LEVEL SECURITY;

-- Política para usuários autenticados gerenciarem comissões de vendedores
CREATE POLICY "Authenticated users can manage seller commissions" 
ON public.seller_commissions 
FOR ALL 
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_seller_commissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_seller_commissions_updated_at
BEFORE UPDATE ON public.seller_commissions
FOR EACH ROW
EXECUTE FUNCTION public.update_seller_commissions_updated_at();