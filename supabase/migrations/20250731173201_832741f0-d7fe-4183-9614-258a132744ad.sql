-- Fix remaining flow functions to include SET search_path = '' for security

-- 1. Fix handle_order_flow function
CREATE OR REPLACE FUNCTION public.handle_order_flow()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  item RECORD;
  product_stock NUMERIC;
  production_record RECORD;
  packaging_record RECORD;
  sale_record RECORD;
BEGIN
  -- Quando um pedido é criado ou atualizado
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.status != NEW.status) THEN
    
    -- Quando pedido é criado (pending), verificar estoque e criar produção se necessário
    IF NEW.status = 'pending' AND TG_OP = 'INSERT' THEN
      FOR item IN SELECT * FROM public.order_items WHERE order_id = NEW.id LOOP
        -- Verificar estoque do produto
        SELECT stock INTO product_stock FROM public.products WHERE id = item.product_id;
        
        -- Se não há estoque suficiente e o produto é fabricado, criar produção
        IF product_stock < item.quantity THEN
          SELECT is_manufactured INTO product_stock FROM public.products WHERE id = item.product_id;
          IF product_stock = true THEN
            INSERT INTO public.production (
              user_id, order_item_id, product_id, product_name, quantity_requested, status
            ) VALUES (
              NEW.user_id, item.id, item.product_id, item.product_name, item.quantity, 'pending'
            );
            
            -- Atualizar status do pedido para produção
            UPDATE public.orders SET status = 'in_production' WHERE id = NEW.id;
          END IF;
        END IF;
      END LOOP;
    END IF;
    
  END IF;
  
  RETURN NEW;
END;
$function$;

-- 2. Fix handle_production_flow function
CREATE OR REPLACE FUNCTION public.handle_production_flow()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  order_item_record RECORD;
BEGIN
  -- Quando produção é aprovada, criar embalagem
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    INSERT INTO public.packaging (
      user_id, production_id, product_id, product_name, quantity_to_package, status
    ) VALUES (
      NEW.user_id, NEW.id, NEW.product_id, NEW.product_name, NEW.quantity_produced, 'pending'
    );
    
    -- Atualizar status do pedido
    SELECT oi.* INTO order_item_record FROM public.order_items oi WHERE oi.id = NEW.order_item_id;
    UPDATE public.orders SET status = 'in_packaging' WHERE id = order_item_record.order_id;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- 3. Fix handle_packaging_flow function
CREATE OR REPLACE FUNCTION public.handle_packaging_flow()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  production_record RECORD;
  order_item_record RECORD;
BEGIN
  -- Quando embalagem é aprovada, liberar para venda
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    SELECT p.* INTO production_record FROM public.production p WHERE p.id = NEW.production_id;
    SELECT oi.* INTO order_item_record FROM public.order_items oi WHERE oi.id = production_record.order_item_id;
    
    -- Atualizar status do pedido
    UPDATE public.orders SET status = 'released_for_sale' WHERE id = order_item_record.order_id;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- 4. Fix handle_sale_flow function
CREATE OR REPLACE FUNCTION public.handle_sale_flow()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  -- Quando venda é confirmada, criar lançamento financeiro
  IF NEW.status = 'confirmed' AND (OLD.status IS NULL OR OLD.status != 'confirmed') THEN
    INSERT INTO public.financial_entries (
      user_id, sale_id, order_id, client_id, type, description, amount, due_date, payment_status
    ) VALUES (
      NEW.user_id, NEW.id, NEW.order_id, NEW.client_id, 'receivable', 
      'Venda confirmada - ' || NEW.sale_number, NEW.total_amount, 
      CURRENT_DATE + INTERVAL '30 days', 'pending'
    );
    
    -- Atualizar status do pedido
    UPDATE public.orders SET status = 'sale_confirmed' WHERE id = NEW.order_id;
  END IF;
  
  RETURN NEW;
END;
$function$;