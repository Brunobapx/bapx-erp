-- Fix the root cause: remove default value and ensure triggers handle everything properly

-- Remove the problematic default value from quotes table
ALTER TABLE public.quotes ALTER COLUMN company_id DROP DEFAULT;

-- Update the trigger to handle company_id FIRST, then quote_number
CREATE OR REPLACE FUNCTION public.set_quote_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  -- FIRST: Ensure company_id is set (this must happen before generating quote_number)
  IF NEW.company_id IS NULL THEN
    -- Try to get from user profile
    SELECT company_id INTO NEW.company_id 
    FROM public.profiles 
    WHERE id = NEW.user_id;
    
    -- If still null, use user_id as fallback (ensures never null)
    IF NEW.company_id IS NULL THEN
      NEW.company_id := NEW.user_id;
    END IF;
  END IF;
  
  -- SECOND: Set quote number (now company_id is guaranteed to be non-null)
  IF NEW.quote_number IS NULL OR NEW.quote_number = '' THEN
    NEW.quote_number := public.generate_sequence_number('ORC', 'quotes', NEW.user_id);
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Update quote_items trigger to be simpler and more robust
CREATE OR REPLACE FUNCTION public.set_quote_item_company()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  -- Ensure company_id is set for quote items
  IF NEW.company_id IS NULL THEN
    -- First try to get from the parent quote
    SELECT company_id INTO NEW.company_id 
    FROM public.quotes 
    WHERE id = NEW.quote_id;
    
    -- If quote doesn't have company_id, get from user profile
    IF NEW.company_id IS NULL THEN
      SELECT company_id INTO NEW.company_id 
      FROM public.profiles 
      WHERE id = NEW.user_id;
    END IF;
    
    -- Final fallback to ensure never null
    IF NEW.company_id IS NULL THEN
      NEW.company_id := NEW.user_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;