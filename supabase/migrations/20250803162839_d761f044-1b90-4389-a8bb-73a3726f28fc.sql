-- Criar tabela para rastrear progresso de itens dos pedidos
CREATE TABLE public.order_item_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_item_id UUID NOT NULL,
  quantity_target INTEGER NOT NULL DEFAULT 0,
  quantity_from_stock INTEGER NOT NULL DEFAULT 0,
  quantity_from_production INTEGER NOT NULL DEFAULT 0,
  quantity_produced_approved INTEGER NOT NULL DEFAULT 0,
  quantity_packaged_approved INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_id UUID NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.order_item_tracking ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS
CREATE POLICY "Authenticated users can manage order item tracking" 
ON public.order_item_tracking 
FOR ALL 
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Trigger para updated_at
CREATE TRIGGER update_order_item_tracking_updated_at
BEFORE UPDATE ON public.order_item_tracking
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Adicionar campos de controle em production para rastrear item do pedido
ALTER TABLE public.production 
ADD COLUMN IF NOT EXISTS tracking_id UUID REFERENCES public.order_item_tracking(id);

-- Adicionar campos de controle em packaging para rastrear item do pedido
ALTER TABLE public.packaging 
ADD COLUMN IF NOT EXISTS tracking_id UUID REFERENCES public.order_item_tracking(id);

-- Criar índices para performance
CREATE INDEX idx_order_item_tracking_order_item ON public.order_item_tracking(order_item_id);
CREATE INDEX idx_order_item_tracking_status ON public.order_item_tracking(status);
CREATE INDEX idx_production_tracking ON public.production(tracking_id);
CREATE INDEX idx_packaging_tracking ON public.packaging(tracking_id);