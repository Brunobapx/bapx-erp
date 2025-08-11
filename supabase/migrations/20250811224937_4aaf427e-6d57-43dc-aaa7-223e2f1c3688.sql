-- Fix packaging approval flow for all companies and both packaging origins (production or direct order)
-- Also ensure triggers exist and backfill existing data for visibility under RLS

-- 1) Update handle_packaging_flow to resolve order via production path OR direct packaging.order_id
CREATE OR REPLACE FUNCTION public.handle_packaging_flow()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
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
          COALESCE(v_seller_id, COALESCE(auth.uid(), NEW.user_id)),
          v_order_id, v_client_id, v_client_name, v_total_amount, 'pending', v_seller_id
        );
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- 2) Ensure required triggers exist (idempotent)
-- Sales numbering before insert
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_sale_number_trigger'
  ) THEN
    CREATE TRIGGER set_sale_number_trigger
    BEFORE INSERT ON public.sales
    FOR EACH ROW EXECUTE FUNCTION public.set_sale_number();
  END IF;
END $$;

-- Updated_at maintenance triggers
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_sales_updated_at'
  ) THEN
    CREATE TRIGGER update_sales_updated_at
    BEFORE UPDATE ON public.sales
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_packaging_updated_at'
  ) THEN
    CREATE TRIGGER update_packaging_updated_at
    BEFORE UPDATE ON public.packaging
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- Packaging flow trigger after update
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_handle_packaging_flow'
  ) THEN
    CREATE TRIGGER trg_handle_packaging_flow
    AFTER UPDATE ON public.packaging
    FOR EACH ROW EXECUTE FUNCTION public.handle_packaging_flow();
  END IF;
END $$;

-- 3) Backfill existing data for visibility and consistency
-- 3a) Reassign sales.user_id to the order's seller when available
UPDATE public.sales s
SET user_id = o.seller_id,
    salesperson_id = o.seller_id,
    updated_at = now()
FROM public.orders o
WHERE s.order_id = o.id
  AND o.seller_id IS NOT NULL
  AND s.user_id IS DISTINCT FROM o.seller_id;

-- 3b) Create missing pending sales for approved packaging linked to orders (direct or via production)
WITH pkg AS (
  SELECT 
    p.id as packaging_id,
    COALESCE(p.order_id, oi.order_id) as resolved_order_id,
    o.client_id,
    o.client_name,
    o.total_amount,
    o.seller_id,
    p.user_id as packaging_user_id
  FROM public.packaging p
  LEFT JOIN public.production pr ON pr.id = p.production_id
  LEFT JOIN public.order_items oi ON oi.id = pr.order_item_id
  LEFT JOIN public.orders o ON o.id = COALESCE(p.order_id, oi.order_id)
  WHERE p.status = 'approved'
)
INSERT INTO public.sales (user_id, order_id, client_id, client_name, total_amount, status, salesperson_id)
SELECT 
  COALESCE(pkg.seller_id, pkg.packaging_user_id) as user_id,
  pkg.resolved_order_id,
  pkg.client_id,
  pkg.client_name,
  pkg.total_amount,
  'pending'::public.sale_status,
  pkg.seller_id
FROM pkg
WHERE pkg.resolved_order_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.sales s WHERE s.order_id = pkg.resolved_order_id
  );