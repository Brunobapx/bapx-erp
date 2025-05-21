
-- Update the orders table to add necessary fields
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS payment_term TEXT,
ALTER COLUMN payment_method DROP NOT NULL;
