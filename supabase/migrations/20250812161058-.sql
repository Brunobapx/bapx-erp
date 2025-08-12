-- Make sale approval idempotent and prevent duplicate receivable inserts
-- 1) Ensure unique constraint exists (defensive)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'unique_sale_financial_entry'
  ) THEN
    ALTER TABLE public.financial_entries
    ADD CONSTRAINT unique_sale_financial_entry UNIQUE (sale_id, type);
  END IF;
END $$;

-- 2) Replace handle_sale_flow to use ON CONFLICT DO NOTHING
CREATE OR REPLACE FUNCTION public.handle_sale_flow()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  -- When a sale is confirmed, create receivable if it doesn't already exist
  IF NEW.status = 'confirmed' AND (OLD.status IS DISTINCT FROM 'confirmed') THEN
    INSERT INTO public.financial_entries (
      user_id, sale_id, order_id, client_id, type, description, amount, due_date, payment_status
    )
    VALUES (
      COALESCE(NEW.user_id, auth.uid()), NEW.id, NEW.order_id, NEW.client_id, 'receivable',
      'Venda confirmada - ' || COALESCE(NEW.sale_number, ''),
      NEW.total_amount,
      CURRENT_DATE + INTERVAL '30 days',
      'pending'
    )
    ON CONFLICT ON CONSTRAINT unique_sale_financial_entry DO NOTHING;

    -- Update order status (idempotent)
    IF NEW.order_id IS NOT NULL THEN
      UPDATE public.orders 
      SET status = 'sale_confirmed', updated_at = now()
      WHERE id = NEW.order_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- 3) Ensure trigger is attached to sales updates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_handle_sale_flow'
  ) THEN
    CREATE TRIGGER trg_handle_sale_flow
    AFTER UPDATE ON public.sales
    FOR EACH ROW EXECUTE FUNCTION public.handle_sale_flow();
  END IF;
END $$;