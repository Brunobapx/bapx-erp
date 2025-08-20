-- Fix the quote creation issue by ensuring proper company_id handling
-- Update the set_quote_number trigger to handle company_id properly

CREATE OR REPLACE FUNCTION public.set_quote_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  -- Set quote number if not provided
  IF NEW.quote_number IS NULL OR NEW.quote_number = '' THEN
    NEW.quote_number := public.generate_sequence_number('ORC', 'quotes', NEW.user_id);
  END IF;
  
  -- Ensure company_id is set if missing
  IF NEW.company_id IS NULL THEN
    SELECT company_id INTO NEW.company_id 
    FROM public.profiles 
    WHERE id = NEW.user_id;
    
    -- If still null, use a default company approach
    IF NEW.company_id IS NULL THEN
      NEW.company_id := NEW.user_id; -- Fallback to user_id as company_id
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS set_quote_number_trigger ON public.quotes;
CREATE TRIGGER set_quote_number_trigger
  BEFORE INSERT ON public.quotes
  FOR EACH ROW
  EXECUTE FUNCTION public.set_quote_number();

-- Also add a trigger to set company_id on quote_items
CREATE OR REPLACE FUNCTION public.set_quote_item_company()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  -- Get company_id from the associated quote
  IF NEW.company_id IS NULL THEN
    SELECT company_id INTO NEW.company_id 
    FROM public.quotes 
    WHERE id = NEW.quote_id;
    
    -- If still null, get from user profile
    IF NEW.company_id IS NULL THEN
      SELECT company_id INTO NEW.company_id 
      FROM public.profiles 
      WHERE id = NEW.user_id;
      
      -- Final fallback
      IF NEW.company_id IS NULL THEN
        NEW.company_id := NEW.user_id;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger for quote_items
DROP TRIGGER IF EXISTS set_quote_item_company_trigger ON public.quote_items;
CREATE TRIGGER set_quote_item_company_trigger
  BEFORE INSERT ON public.quote_items
  FOR EACH ROW
  EXECUTE FUNCTION public.set_quote_item_company();