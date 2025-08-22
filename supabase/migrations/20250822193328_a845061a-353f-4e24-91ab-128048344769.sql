-- Limpar triggers duplicados da tabela packaging
DROP TRIGGER IF EXISTS tr_packaging_flow ON public.packaging;
DROP TRIGGER IF EXISTS trg_handle_packaging_flow ON public.packaging;
DROP TRIGGER IF EXISTS trigger_handle_packaging_flow ON public.packaging;

-- Recriar apenas um trigger limpo
CREATE TRIGGER tr_packaging_flow_clean
    AFTER UPDATE ON public.packaging
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_packaging_flow();

-- Atualizar a função handle_packaging_flow para corrigir a atualização do tracking
CREATE OR REPLACE FUNCTION public.handle_packaging_flow()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  production_record RECORD;
  v_order_id uuid;
  v_client_id uuid;
  v_client_name text;
  v_total_amount numeric;
  v_seller_id uuid;
  order_ready_for_sale boolean;
  v_order_item_id uuid;
BEGIN
  -- When packaging is approved for the first time
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status <> 'approved') THEN
    -- First try: direct link via packaging.order_id
    IF NEW.order_id IS NOT NULL THEN
      SELECT o.id, o.client_id, o.client_name, o.total_amount, o.seller_id
        INTO v_order_id, v_client_id, v_client_name, v_total_amount, v_seller_id
      FROM public.orders o
      WHERE o.id = NEW.order_id;
    END IF;

    -- Fallback: production -> order_item -> order
    IF v_order_id IS NULL AND NEW.production_id IS NOT NULL THEN
      SELECT p.* INTO production_record FROM public.production p WHERE p.id = NEW.production_id;

      IF production_record.order_item_id IS NOT NULL THEN
        SELECT o.id,
               o.client_id,
               o.client_name,
               o.total_amount,
               o.seller_id,
               oi.id as order_item_id
          INTO v_order_id, v_client_id, v_client_name, v_total_amount, v_seller_id, v_order_item_id
          FROM public.order_items oi
          JOIN public.orders o ON o.id = oi.order_id
         WHERE oi.id = production_record.order_item_id;
      END IF;
    END IF;

    -- Update order_item_tracking with approved packaging quantity
    IF v_order_item_id IS NOT NULL THEN
      UPDATE public.order_item_tracking
      SET quantity_packaged_approved = COALESCE(quantity_packaged_approved, 0) + COALESCE(NEW.quantity_packaged, 0),
          updated_at = now()
      WHERE order_item_id = v_order_item_id;
    END IF;

    -- If we have an order, check if ALL items are ready before releasing
    IF v_order_id IS NOT NULL THEN
      -- Verificar se TODOS os itens do pedido estão prontos para venda
      SELECT public.check_order_ready_for_sale(v_order_id) INTO order_ready_for_sale;
      
      IF order_ready_for_sale THEN
        -- Só libera para venda se TODOS os itens estiverem aprovados
        UPDATE public.orders 
           SET status = 'released_for_sale', updated_at = now()
         WHERE id = v_order_id;

        -- Create a sale if it doesn't exist yet for this order
        IF NOT EXISTS (
          SELECT 1 FROM public.sales s WHERE s.order_id = v_order_id
        ) THEN
          INSERT INTO public.sales (
            user_id, order_id, client_id, client_name, total_amount, status, salesperson_id
          ) VALUES (
            COALESCE(auth.uid(), NEW.user_id),
            v_order_id, v_client_id, v_client_name, v_total_amount, 'pending', v_seller_id
          );
        END IF;
      ELSE
        -- Se nem todos os itens estão prontos, manter status 'in_packaging'
        UPDATE public.orders 
           SET status = 'in_packaging', updated_at = now()
         WHERE id = v_order_id;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;