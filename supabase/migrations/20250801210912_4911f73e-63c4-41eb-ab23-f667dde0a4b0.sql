-- Criar tabela para movimentações de estoque
CREATE TABLE public.stock_movements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  product_id UUID NOT NULL,
  product_name TEXT NOT NULL,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('entrada', 'saida', 'ajuste', 'producao', 'venda')),
  quantity NUMERIC NOT NULL CHECK (quantity > 0),
  previous_stock NUMERIC NOT NULL DEFAULT 0,
  new_stock NUMERIC NOT NULL DEFAULT 0,
  reason TEXT NOT NULL,
  reference_id UUID,
  reference_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS
CREATE POLICY "Authenticated users can view stock movements"
ON public.stock_movements
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert stock movements"
ON public.stock_movements
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Criar índices para melhorar performance
CREATE INDEX idx_stock_movements_product_id ON public.stock_movements(product_id);
CREATE INDEX idx_stock_movements_user_id ON public.stock_movements(user_id);
CREATE INDEX idx_stock_movements_created_at ON public.stock_movements(created_at);
CREATE INDEX idx_stock_movements_reference ON public.stock_movements(reference_id, reference_type);

-- Criar trigger para atualizar updated_at
CREATE TRIGGER update_stock_movements_updated_at
    BEFORE UPDATE ON public.stock_movements
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();