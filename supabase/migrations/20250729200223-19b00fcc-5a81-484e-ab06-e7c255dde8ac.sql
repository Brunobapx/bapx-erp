-- Fix remaining database functions with search_path protection

CREATE OR REPLACE FUNCTION public.handle_order_flow()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER SET search_path = ''
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

CREATE OR REPLACE FUNCTION public.handle_production_flow()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER SET search_path = ''
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

CREATE OR REPLACE FUNCTION public.handle_packaging_flow()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER SET search_path = ''
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

CREATE OR REPLACE FUNCTION public.handle_sale_flow()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER SET search_path = ''
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

CREATE OR REPLACE FUNCTION public.validate_cpf(cpf text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER SET search_path = ''
AS $function$
DECLARE
  cpf_clean TEXT;
  digit1 INTEGER;
  digit2 INTEGER;
  sum1 INTEGER := 0;
  sum2 INTEGER := 0;
  i INTEGER;
BEGIN
  -- Remover caracteres não numéricos
  cpf_clean := regexp_replace(cpf, '[^0-9]', '', 'g');
  
  -- Verificar se tem 11 dígitos
  IF length(cpf_clean) != 11 THEN
    RETURN FALSE;
  END IF;
  
  -- Verificar sequências inválidas
  IF cpf_clean IN ('00000000000', '11111111111', '22222222222', '33333333333', 
                   '44444444444', '55555555555', '66666666666', '77777777777',
                   '88888888888', '99999999999') THEN
    RETURN FALSE;
  END IF;
  
  -- Calcular primeiro dígito verificador
  FOR i IN 1..9 LOOP
    sum1 := sum1 + (substring(cpf_clean from i for 1)::INTEGER * (11 - i));
  END LOOP;
  
  digit1 := 11 - (sum1 % 11);
  IF digit1 >= 10 THEN
    digit1 := 0;
  END IF;
  
  -- Calcular segundo dígito verificador
  FOR i IN 1..10 LOOP
    sum2 := sum2 + (substring(cpf_clean from i for 1)::INTEGER * (12 - i));
  END LOOP;
  
  digit2 := 11 - (sum2 % 11);
  IF digit2 >= 10 THEN
    digit2 := 0;
  END IF;
  
  -- Verificar dígitos
  RETURN (substring(cpf_clean from 10 for 1)::INTEGER = digit1) AND 
         (substring(cpf_clean from 11 for 1)::INTEGER = digit2);
END;
$function$;

CREATE OR REPLACE FUNCTION public.validate_cnpj(cnpj text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER SET search_path = ''
AS $function$
DECLARE
  cnpj_clean TEXT;
  digit1 INTEGER;
  digit2 INTEGER;
  sum1 INTEGER := 0;
  sum2 INTEGER := 0;
  weights1 INTEGER[] := ARRAY[5,4,3,2,9,8,7,6,5,4,3,2];
  weights2 INTEGER[] := ARRAY[6,5,4,3,2,9,8,7,6,5,4,3,2];
  i INTEGER;
BEGIN
  -- Remover caracteres não numéricos
  cnpj_clean := regexp_replace(cnpj, '[^0-9]', '', 'g');
  
  -- Verificar se tem 14 dígitos
  IF length(cnpj_clean) != 14 THEN
    RETURN FALSE;
  END IF;
  
  -- Calcular primeiro dígito verificador
  FOR i IN 1..12 LOOP
    sum1 := sum1 + (substring(cnpj_clean from i for 1)::INTEGER * weights1[i]);
  END LOOP;
  
  digit1 := sum1 % 11;
  IF digit1 < 2 THEN
    digit1 := 0;
  ELSE
    digit1 := 11 - digit1;
  END IF;
  
  -- Calcular segundo dígito verificador
  FOR i IN 1..13 LOOP
    sum2 := sum2 + (substring(cnpj_clean from i for 1)::INTEGER * weights2[i]);
  END LOOP;
  
  digit2 := sum2 % 11;
  IF digit2 < 2 THEN
    digit2 := 0;
  ELSE
    digit2 := 11 - digit2;
  END IF;
  
  -- Verificar dígitos
  RETURN (substring(cnpj_clean from 13 for 1)::INTEGER = digit1) AND 
         (substring(cnpj_clean from 14 for 1)::INTEGER = digit2);
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_row_count(table_name text)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER SET search_path = ''
AS $function$
DECLARE
  row_count integer;
BEGIN
  EXECUTE format('SELECT COUNT(*) FROM public.%I', table_name) INTO row_count;
  RETURN row_count;
EXCEPTION
  WHEN undefined_table THEN
    RETURN 0;
  WHEN insufficient_privilege THEN
    RETURN 0;
END;
$function$;

-- Create function to log security events (if not exists)
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_user_id UUID,
  p_action TEXT,
  p_resource_type TEXT,
  p_resource_id UUID DEFAULT NULL,
  p_details JSONB DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $function$
BEGIN
  INSERT INTO public.security_audit_log (
    user_id,
    action,
    resource_type,
    resource_id,
    details
  ) VALUES (
    p_user_id,
    p_action,
    p_resource_type,
    p_resource_id,
    p_details
  );
END;
$function$;