-- Fix packaging -> sales flow: ensure triggers exist and auto-create sale on packaging approval

-- 1) Update function to also create a sale when packaging is approved
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
BEGIN
  -- When packaging is approved for the first time
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status <> 'approved') THEN
    -- Try to locate the related order via production -> order_item -> order
    IF NEW.production_id IS NOT NULL THEN
      SELECT p.* INTO production_record FROM public.production p WHERE p.id = NEW.production_id;

      IF production_record.order_item_id IS NOT NULL THEN
        SELECT o.id, o.client_id, o.client_name, o.total_amount
        INTO v_order_id, v_client_id, v_client_name, v_total_amount
        FROM public.order_items oi
        JOIN public.orders o ON o.id = oi.order_id
        WHERE oi.id = production_record.order_item_id;

        -- Update order status to released_for_sale if we found it
        IF v_order_id IS NOT NULL THEN
          UPDATE public.orders 
            SET status = 'released_for_sale', updated_at = now()
          WHERE id = v_order_id;

          -- Create a sale if it doesn't exist yet for this order
          IF NOT EXISTS (
            SELECT 1 FROM public.sales s WHERE s.order_id = v_order_id
          ) THEN
            INSERT INTO public.sales (
              user_id, order_id, client_id, client_name, total_amount, status
            ) VALUES (
              NEW.user_id, v_order_id, v_client_id, v_client_name, v_total_amount, 'pending'
            );
          END IF;
        END IF;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

-- 2) Attach necessary triggers (drop if existing to avoid duplication)

-- Packaging: prevent updates after approval, set numbering, updated_at, and flow
DROP TRIGGER IF EXISTS tr_packaging_prevent_update_approved ON public.packaging;
CREATE TRIGGER tr_packaging_prevent_update_approved
  BEFORE UPDATE ON public.packaging
  FOR EACH ROW EXECUTE FUNCTION public.prevent_update_if_approved_packaging();

DROP TRIGGER IF EXISTS tr_packaging_set_number ON public.packaging;
CREATE TRIGGER tr_packaging_set_number
  BEFORE INSERT ON public.packaging
  FOR EACH ROW EXECUTE FUNCTION public.set_packaging_number();

DROP TRIGGER IF EXISTS tr_packaging_updated_at ON public.packaging;
CREATE TRIGGER tr_packaging_updated_at
  BEFORE UPDATE ON public.packaging
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS tr_packaging_flow ON public.packaging;
CREATE TRIGGER tr_packaging_flow
  AFTER UPDATE ON public.packaging
  FOR EACH ROW EXECUTE FUNCTION public.handle_packaging_flow();

-- Sales: set numbering, updated_at, and flow (financial entry creation on confirmation)
DROP TRIGGER IF EXISTS tr_sales_set_number ON public.sales;
CREATE TRIGGER tr_sales_set_number
  BEFORE INSERT ON public.sales
  FOR EACH ROW EXECUTE FUNCTION public.set_sale_number();

DROP TRIGGER IF EXISTS tr_sales_updated_at ON public.sales;
CREATE TRIGGER tr_sales_updated_at
  BEFORE UPDATE ON public.sales
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS tr_sales_flow ON public.sales;
CREATE TRIGGER tr_sales_flow
  AFTER UPDATE ON public.sales
  FOR EACH ROW EXECUTE FUNCTION public.handle_sale_flow();

-- Financial entries: set numbering and updated_at
DROP TRIGGER IF EXISTS tr_financial_entries_set_number ON public.financial_entries;
CREATE TRIGGER tr_financial_entries_set_number
  BEFORE INSERT ON public.financial_entries
  FOR EACH ROW EXECUTE FUNCTION public.set_entry_number();

DROP TRIGGER IF EXISTS tr_financial_entries_updated_at ON public.financial_entries;
CREATE TRIGGER tr_financial_entries_updated_at
  BEFORE UPDATE ON public.financial_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();