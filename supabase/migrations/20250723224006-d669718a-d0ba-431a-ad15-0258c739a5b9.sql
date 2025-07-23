-- Add discount fields to sales table
ALTER TABLE public.sales 
ADD COLUMN IF NOT EXISTS discount_percentage NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS discount_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS original_amount NUMERIC DEFAULT 0;