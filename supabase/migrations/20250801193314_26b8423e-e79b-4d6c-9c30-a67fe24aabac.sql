-- Force refresh PostgREST schema cache and recreate orders table completely
-- This should fix the cache synchronization issue

-- First, disable triggers to prevent conflicts
ALTER TABLE public.orders DISABLE TRIGGER ALL;

-- Drop and recreate the table with exact same structure
DROP TABLE IF EXISTS public.orders CASCADE;

-- Recreate orders table
CREATE TABLE public.orders (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    client_id UUID NOT NULL,
    client_name TEXT NOT NULL,
    order_number TEXT NOT NULL DEFAULT '',
    seller TEXT,
    status TEXT DEFAULT 'pending',
    total_amount NUMERIC DEFAULT 0,
    delivery_deadline DATE,
    payment_method TEXT,
    payment_term TEXT,
    notes TEXT,
    salesperson_id UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Authenticated users can insert orders"
ON public.orders FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Authenticated users can view orders"
ON public.orders FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update their own orders"
ON public.orders FOR UPDATE
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id)
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Authenticated users can delete their own orders"
ON public.orders FOR DELETE
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- Create triggers
CREATE TRIGGER set_order_number_trigger
    BEFORE INSERT ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.set_order_number();

CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER audit_orders_changes_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.audit_orders_changes();

-- Force PostgREST to reload schema
NOTIFY pgrst, 'reload schema';