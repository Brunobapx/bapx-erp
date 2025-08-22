-- Atualizar função handle_production_flow para consolidar embalagens
CREATE OR REPLACE FUNCTION public.handle_production_flow()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  order_item_record RECORD;
  existing_packaging_id uuid;
BEGIN
  -- Quando produção é aprovada, consolidar ou criar embalagem
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    
    -- Buscar order_item para obter order_id
    SELECT oi.* INTO order_item_record FROM public.order_items oi WHERE oi.id = NEW.order_item_id;
    
    -- Verificar se já existe embalagem para o mesmo pedido + produto
    SELECT id INTO existing_packaging_id 
    FROM public.packaging 
    WHERE order_id = order_item_record.order_id 
      AND product_id = NEW.product_id
      AND status != 'approved'  -- Só consolida se ainda não foi aprovada
    LIMIT 1;
    
    IF existing_packaging_id IS NOT NULL THEN
      -- Atualizar embalagem existente, somando as quantidades
      UPDATE public.packaging 
      SET 
        quantity_to_package = quantity_to_package + NEW.quantity_produced,
        updated_at = now()
      WHERE id = existing_packaging_id;
    ELSE
      -- Criar nova embalagem se não existir
      INSERT INTO public.packaging (
        user_id, production_id, product_id, product_name, quantity_to_package, 
        status, order_id, client_id, client_name, tracking_id
      ) VALUES (
        NEW.user_id, NEW.id, NEW.product_id, NEW.product_name, NEW.quantity_produced, 
        'pending', order_item_record.order_id, order_item_record.order_id, '', NEW.tracking_id
      );
    END IF;
    
    -- Atualizar status do pedido
    UPDATE public.orders SET status = 'in_packaging' WHERE id = order_item_record.order_id;
  END IF;
  
  RETURN NEW;
END;
$function$;