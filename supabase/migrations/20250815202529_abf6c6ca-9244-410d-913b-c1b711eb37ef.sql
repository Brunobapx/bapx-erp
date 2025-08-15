-- Adicionar company_id à tabela user_positions se não existir
ALTER TABLE public.user_positions 
ADD COLUMN IF NOT EXISTS company_id uuid;

-- Definir trigger para preenchimento automático do company_id
CREATE TRIGGER set_company_id_user_positions
  BEFORE INSERT ON public.user_positions
  FOR EACH ROW
  EXECUTE FUNCTION public.set_company_id();

-- Atualizar registros existentes sem company_id
UPDATE public.user_positions 
SET company_id = (
  SELECT company_id 
  FROM public.profiles 
  WHERE profiles.id = user_positions.user_id
)
WHERE company_id IS NULL;

-- Habilitar RLS na tabela user_positions
ALTER TABLE public.user_positions ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes se houver
DROP POLICY IF EXISTS "Users can view all positions" ON public.user_positions;
DROP POLICY IF EXISTS "Users can manage positions" ON public.user_positions;
DROP POLICY IF EXISTS "Admins can view all positions" ON public.user_positions;
DROP POLICY IF EXISTS "Admins can manage all positions" ON public.user_positions;

-- Criar política de isolamento por empresa
CREATE POLICY "Company isolation" ON public.user_positions
  FOR ALL
  USING (company_id = current_user_company_id())
  WITH CHECK (company_id = current_user_company_id());