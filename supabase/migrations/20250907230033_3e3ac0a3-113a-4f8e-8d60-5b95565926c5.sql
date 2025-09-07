-- Create shipping_addresses table for e-commerce orders
CREATE TABLE public.shipping_addresses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  street_address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'Brasil',
  complement TEXT,
  neighborhood TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ecommerce_orders table if it doesn't exist (update existing)
ALTER TABLE public.ecommerce_orders 
ADD COLUMN IF NOT EXISTS total_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS items JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS customer_name TEXT,
ADD COLUMN IF NOT EXISTS order_status TEXT DEFAULT 'pending';

-- Enable RLS on shipping_addresses
ALTER TABLE public.shipping_addresses ENABLE ROW LEVEL SECURITY;

-- Create policies for public e-commerce access on shipping_addresses
CREATE POLICY "Public can insert shipping addresses for e-commerce"
ON public.shipping_addresses
FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "Company can view shipping addresses"
ON public.shipping_addresses
FOR SELECT
USING (true);

-- Update ecommerce_orders policies to allow public access
CREATE POLICY "Public can insert e-commerce orders"
ON public.ecommerce_orders
FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "Public can view e-commerce orders"
ON public.ecommerce_orders
FOR SELECT
TO anon
USING (true);

-- Create trigger for shipping_addresses timestamps
CREATE TRIGGER update_shipping_addresses_updated_at
  BEFORE UPDATE ON public.shipping_addresses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();