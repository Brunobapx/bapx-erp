-- Enforce immutability after approval for production and packaging

-- Function to prevent updates on approved production rows
CREATE OR REPLACE FUNCTION public.prevent_update_if_approved_production()
RETURNS trigger AS $$
BEGIN
  -- Block ANY update if the row is already approved
  IF TG_OP = 'UPDATE' AND OLD.status = 'approved' THEN
    RAISE EXCEPTION 'Atualização bloqueada: produção já aprovada não pode ser alterada';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '';

-- Function to prevent updates on approved packaging rows
CREATE OR REPLACE FUNCTION public.prevent_update_if_approved_packaging()
RETURNS trigger AS $$
BEGIN
  -- Block ANY update if the row is already approved
  IF TG_OP = 'UPDATE' AND OLD.status = 'approved' THEN
    RAISE EXCEPTION 'Atualização bloqueada: embalagem já aprovada não pode ser alterada';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '';

-- Drop existing triggers if they exist to avoid duplicates
DROP TRIGGER IF EXISTS trg_prevent_update_if_approved_production ON public.production;
DROP TRIGGER IF EXISTS trg_prevent_update_if_approved_packaging ON public.packaging;

-- Create triggers
CREATE TRIGGER trg_prevent_update_if_approved_production
BEFORE UPDATE ON public.production
FOR EACH ROW
EXECUTE FUNCTION public.prevent_update_if_approved_production();

CREATE TRIGGER trg_prevent_update_if_approved_packaging
BEFORE UPDATE ON public.packaging
FOR EACH ROW
EXECUTE FUNCTION public.prevent_update_if_approved_packaging();