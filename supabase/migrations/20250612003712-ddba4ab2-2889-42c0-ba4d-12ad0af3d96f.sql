
-- Adicionar campos order_id e client_id na tabela packaging para rastreamento
ALTER TABLE public.packaging 
ADD COLUMN order_id uuid,
ADD COLUMN client_id uuid,
ADD COLUMN client_name text;

-- Criar trigger para gerar automaticamente o packaging_number
CREATE OR REPLACE FUNCTION public.set_packaging_number()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.packaging_number IS NULL OR NEW.packaging_number = '' THEN
    NEW.packaging_number := generate_sequence_number('EMB', 'packaging', NEW.user_id);
  END IF;
  RETURN NEW;
END;
$function$;

-- Aplicar trigger na tabela packaging
DROP TRIGGER IF EXISTS set_packaging_number_trigger ON public.packaging;
CREATE TRIGGER set_packaging_number_trigger
  BEFORE INSERT ON public.packaging
  FOR EACH ROW
  EXECUTE FUNCTION public.set_packaging_number();
