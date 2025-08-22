-- Update the handle_packaging_flow function to recalculate order total based on approved packaging quantities
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
  v_new_total_amount numeric := 0;
BEGIN
  -- When packaging is approved for the first time
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status <> 'approved') THEN
    
    -- Try to find order_item_id through different paths
    v_order_item_id := NULL;
    
    -- Method 1: Through production_id (for items that went through production)
    IF NEW.production_id IS NOT NULL THEN
      SELECT p.order_item_id INTO v_order_item_id 
      FROM public.production p 
      WHERE p.id = NEW.production_id;
    END IF;
    
    -- Method 2: Through tracking_id (for items from stock or mixed origin)
    IF v_order_item_id IS NULL AND NEW.tracking_id IS NOT NULL THEN
      SELECT oit.order_item_id INTO v_order_item_id 
      FROM public.order_item_tracking oit 
      WHERE oit.id = NEW.tracking_id;
    END IF;
    
    -- Method 3: Direct lookup by order_id and product_id (fallback)
    IF v_order_item_id IS NULL AND NEW.order_id IS NOT NULL AND NEW.product_id IS NOT NULL THEN
      SELECT oi.id INTO v_order_item_id 
      FROM public.order_items oi 
      WHERE oi.order_id = NEW.order_id AND oi.product_id = NEW.product_id
      LIMIT 1;
    END IF;

    -- Update order_item_tracking with approved packaging quantity
    IF v_order_item_id IS NOT NULL THEN
      UPDATE public.order_item_tracking
      SET quantity_packaged_approved = COALESCE(quantity_packaged_approved, 0) + COALESCE(NEW.quantity_packaged, 0),
          updated_at = now()
      WHERE order_item_id = v_order_item_id;
      
      -- Get order info
      SELECT o.id, o.client_id, o.client_name, o.total_amount, o.seller_id
        INTO v_order_id, v_client_id, v_client_name, v_total_amount, v_seller_id
      FROM public.order_items oi
      JOIN public.orders o ON o.id = oi.order_id
      WHERE oi.id = v_order_item_id;
    ELSE
      -- Fallback: get order info directly
      IF NEW.order_id IS NOT NULL THEN
        SELECT o.id, o.client_id, o.client_name, o.total_amount, o.seller_id
          INTO v_order_id, v_client_id, v_client_name, v_total_amount, v_seller_id
        FROM public.orders o
        WHERE o.id = NEW.order_id;
      END IF;
    END IF;

    -- Recalculate order total based on approved packaging quantities
    IF v_order_id IS NOT NULL THEN
      -- Calculate new total amount based on approved quantities
      SELECT COALESCE(SUM(oi.unit_price * LEAST(oit.quantity_packaged_approved, oi.quantity)), 0)
      INTO v_new_total_amount
      FROM public.order_items oi
      LEFT JOIN public.order_item_tracking oit ON oit.order_item_id = oi.id
      WHERE oi.order_id = v_order_id;
      
      -- Update order with new total amount
      UPDATE public.orders 
      SET total_amount = v_new_total_amount, updated_at = now()
      WHERE id = v_order_id;
      
      -- Check if ALL items in the order are ready for sale
      SELECT public.check_order_ready_for_sale(v_order_id) INTO order_ready_for_sale;
      
      IF order_ready_for_sale THEN
        -- Release order for sale only when ALL items are approved
        UPDATE public.orders 
           SET status = 'released_for_sale', updated_at = now()
         WHERE id = v_order_id;

        -- Create or update sale with new total amount
        INSERT INTO public.sales (
          user_id, order_id, client_id, client_name, total_amount, status, salesperson_id
        ) VALUES (
          COALESCE(auth.uid(), NEW.user_id),
          v_order_id, v_client_id, v_client_name, v_new_total_amount, 'pending', v_seller_id
        )
        ON CONFLICT (order_id) DO UPDATE SET
          total_amount = EXCLUDED.total_amount,
          updated_at = now();
      ELSE
        -- Keep status as 'in_packaging' if not all items are ready
        UPDATE public.orders 
           SET status = 'in_packaging', updated_at = now()
         WHERE id = v_order_id;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;