-- Ajuste: tornar inserção em sales compatível com RLS para vendedores em todas as empresas
-- user_id da venda passa a ser o usuário autenticado (quem aprovou a embalagem),
-- enquanto salesperson_id continua sendo o vendedor do pedido

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
               o.seller_id
          INTO v_order_id, v_client_id, v_client_name, v_total_amount, v_seller_id
          FROM public.order_items oi
          JOIN public.orders o ON o.id = oi.order_id
         WHERE oi.id = production_record.order_item_id;
      END IF;
    END IF;

    -- If we have an order, update status and create pending sale if missing
    IF v_order_id IS NOT NULL THEN
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
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;