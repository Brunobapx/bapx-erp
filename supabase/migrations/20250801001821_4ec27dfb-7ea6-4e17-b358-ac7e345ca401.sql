-- Etapa 1: Recrear Triggers Essenciais (CRÍTICO)

-- Recriar trigger para gerar números de pedidos automaticamente
DROP TRIGGER IF EXISTS set_order_number_trigger ON public.orders;
CREATE TRIGGER set_order_number_trigger
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.set_order_number();

-- Recriar trigger para auditoria de pedidos
DROP TRIGGER IF EXISTS audit_orders_changes_trigger ON public.orders;
CREATE TRIGGER audit_orders_changes_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_orders_changes();

-- Verificar se existe foreign key entre production e order_items (corrigir erro dos logs)
-- Se não existir, criar a foreign key
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'production_order_item_id_fkey'
  ) THEN
    ALTER TABLE public.production 
    ADD CONSTRAINT production_order_item_id_fkey 
    FOREIGN KEY (order_item_id) REFERENCES public.order_items(id);
  END IF;
END $$;

-- Etapa 2: Simplificar e fortalecer políticas RLS para orders
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.orders;
CREATE POLICY "Enable all operations for authenticated users" 
ON public.orders 
FOR ALL 
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Simplificar políticas RLS para order_items
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.order_items;
CREATE POLICY "Enable all operations for authenticated users" 
ON public.order_items 
FOR ALL 
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);