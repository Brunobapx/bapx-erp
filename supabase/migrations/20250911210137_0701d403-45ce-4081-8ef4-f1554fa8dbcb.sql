-- Add missing columns to fiscal_operations table
ALTER TABLE public.fiscal_operations 
ADD COLUMN operation_name text,
ADD COLUMN cfop_dentro_estado text,
ADD COLUMN cfop_fora_estado text,
ADD COLUMN cfop_exterior text;

-- Update existing records to have operation_name same as operation_type initially
UPDATE public.fiscal_operations 
SET operation_name = operation_type
WHERE operation_name IS NULL;

-- Update existing records to use cfop field for dentro_estado initially
UPDATE public.fiscal_operations 
SET cfop_dentro_estado = cfop,
    cfop_fora_estado = cfop
WHERE cfop_dentro_estado IS NULL;