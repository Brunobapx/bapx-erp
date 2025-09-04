-- Create e-commerce specific tables

-- Create shipping addresses table
CREATE TABLE public.shipping_addresses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  recipient_name TEXT NOT NULL,
  street_address TEXT NOT NULL,
  number TEXT NOT NULL,
  complement TEXT,
  neighborhood TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  company_id UUID NOT NULL DEFAULT current_user_company_id()
);

-- Enable RLS for shipping addresses
ALTER TABLE public.shipping_addresses ENABLE ROW LEVEL SECURITY;

-- Create policy for shipping addresses
CREATE POLICY "Company isolation" ON public.shipping_addresses
  FOR ALL USING (company_id = current_user_company_id());

-- Create e-commerce orders table (extends regular orders with e-commerce specific data)
CREATE TABLE public.ecommerce_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  session_id TEXT,
  shipping_address_id UUID REFERENCES public.shipping_addresses(id),
  shipping_method TEXT NOT NULL DEFAULT 'standard',
  shipping_cost NUMERIC DEFAULT 0,
  payment_method TEXT NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'pending',
  payment_id TEXT, -- ID from payment gateway
  preference_id TEXT, -- Mercado Pago preference ID
  paid_at TIMESTAMP WITH TIME ZONE,
  shipping_tracking_code TEXT,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  company_id UUID NOT NULL DEFAULT current_user_company_id()
);

-- Enable RLS for e-commerce orders
ALTER TABLE public.ecommerce_orders ENABLE ROW LEVEL SECURITY;

-- Create policy for e-commerce orders
CREATE POLICY "Company isolation" ON public.ecommerce_orders
  FOR ALL USING (company_id = current_user_company_id());

-- Create cart sessions table for persistent carts
CREATE TABLE public.cart_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL UNIQUE,
  items JSONB NOT NULL DEFAULT '[]',
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for cart sessions (public access with session validation)
ALTER TABLE public.cart_sessions ENABLE ROW LEVEL SECURITY;

-- Create public policy for cart sessions
CREATE POLICY "Public cart access" ON public.cart_sessions
  FOR ALL USING (true);

-- Create triggers for updated_at
CREATE TRIGGER update_shipping_addresses_updated_at
  BEFORE UPDATE ON public.shipping_addresses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ecommerce_orders_updated_at
  BEFORE UPDATE ON public.ecommerce_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cart_sessions_updated_at
  BEFORE UPDATE ON public.cart_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();