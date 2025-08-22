-- Drop and recreate the trigger to ensure it's working
DROP TRIGGER IF EXISTS tr_packaging_flow_clean ON public.packaging;

-- Create a function to fix the current state of order 12
CREATE OR REPLACE FUNCTION public.fix_order_12_tracking()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  -- Update order_item_tracking for all items in order 12 based on approved packaging
  UPDATE public.order_item_tracking 
  SET quantity_packaged_approved = 100, updated_at = now()
  WHERE order_item_id IN (
    SELECT oi.id FROM public.order_items oi WHERE oi.order_id = '40a78da0-ef01-4916-b458-f7da19f95fcd'
  );
  
  -- Update order status to released_for_sale since all items are approved
  UPDATE public.orders 
  SET status = 'released_for_sale', updated_at = now()
  WHERE id = '40a78da0-ef01-4916-b458-f7da19f95fcd';
  
  -- Create sale record if it doesn't exist
  INSERT INTO public.sales (
    user_id, order_id, client_id, client_name, total_amount, status, salesperson_id
  )
  SELECT 
    o.user_id, o.id, o.client_id, o.client_name, o.total_amount, 'pending', o.seller_id
  FROM public.orders o 
  WHERE o.id = '40a78da0-ef01-4916-b458-f7da19f95fcd'
  ON CONFLICT DO NOTHING;
END;
$function$;

-- Execute the fix function
SELECT public.fix_order_12_tracking();

-- Recreate the trigger with proper event timing
CREATE TRIGGER tr_packaging_flow_clean
  AFTER UPDATE ON public.packaging
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_packaging_flow();