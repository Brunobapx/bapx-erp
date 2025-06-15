
-- FASE 1: Correções Críticas de Segurança

-- 1. Adicionar política INSERT ausente para a tabela profiles
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- 2. Adicionar política INSERT para masters criarem perfis de outros usuários
CREATE POLICY "Masters can insert any profile" ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'master'));

-- 3. Consolidar e simplificar políticas RLS duplicadas
-- Remover políticas redundantes e criar políticas mais específicas

-- Para a tabela companies - simplificar políticas duplicadas
DROP POLICY IF EXISTS "Masters can delete companies" ON public.companies;
DROP POLICY IF EXISTS "Masters can create companies" ON public.companies;
DROP POLICY IF EXISTS "Masters can view all companies" ON public.companies;
DROP POLICY IF EXISTS "Masters can update all companies" ON public.companies;
DROP POLICY IF EXISTS "Users can view own company" ON public.companies;

-- Recriar políticas de companies mais seguras e específicas
CREATE POLICY "Masters can manage all companies" ON public.companies
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'master'))
  WITH CHECK (public.has_role(auth.uid(), 'master'));

CREATE POLICY "Users can view own company" ON public.companies
  FOR SELECT TO authenticated
  USING (id = public.get_current_user_company_id());

-- 4. Adicionar auditoria de segurança para operações sensíveis
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS na tabela de auditoria
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- Apenas masters podem ver logs de auditoria
CREATE POLICY "Masters can view audit logs" ON public.security_audit_log
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'master'));

-- 5. Função para registrar eventos de segurança
CREATE OR REPLACE FUNCTION public.log_security_event(
  action_name TEXT,
  table_name TEXT,
  record_id UUID DEFAULT NULL,
  old_data JSONB DEFAULT NULL,
  new_data JSONB DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  INSERT INTO public.security_audit_log (
    user_id, action, table_name, record_id, old_values, new_values
  ) VALUES (
    auth.uid(), action_name, table_name, record_id, old_data, new_data
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Triggers de auditoria para operações críticas em user_roles
CREATE OR REPLACE FUNCTION public.audit_user_roles()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.log_security_event('USER_ROLE_CREATED', 'user_roles', NEW.id, NULL, to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM public.log_security_event('USER_ROLE_UPDATED', 'user_roles', NEW.id, to_jsonb(OLD), to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.log_security_event('USER_ROLE_DELETED', 'user_roles', OLD.id, to_jsonb(OLD), NULL);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger de auditoria para user_roles
DROP TRIGGER IF EXISTS audit_user_roles_trigger ON public.user_roles;
CREATE TRIGGER audit_user_roles_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.audit_user_roles();

-- 7. Melhorar validação de entrada para CPF/CNPJ
CREATE OR REPLACE FUNCTION public.validate_cpf(cpf TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  cpf_clean TEXT;
  digit1 INTEGER;
  digit2 INTEGER;
  sum1 INTEGER := 0;
  sum2 INTEGER := 0;
  i INTEGER;
BEGIN
  -- Remover caracteres não numéricos
  cpf_clean := regexp_replace(cpf, '[^0-9]', '', 'g');
  
  -- Verificar se tem 11 dígitos
  IF length(cpf_clean) != 11 THEN
    RETURN FALSE;
  END IF;
  
  -- Verificar sequências inválidas
  IF cpf_clean IN ('00000000000', '11111111111', '22222222222', '33333333333', 
                   '44444444444', '55555555555', '66666666666', '77777777777',
                   '88888888888', '99999999999') THEN
    RETURN FALSE;
  END IF;
  
  -- Calcular primeiro dígito verificador
  FOR i IN 1..9 LOOP
    sum1 := sum1 + (substring(cpf_clean from i for 1)::INTEGER * (11 - i));
  END LOOP;
  
  digit1 := 11 - (sum1 % 11);
  IF digit1 >= 10 THEN
    digit1 := 0;
  END IF;
  
  -- Calcular segundo dígito verificador
  FOR i IN 1..10 LOOP
    sum2 := sum2 + (substring(cpf_clean from i for 1)::INTEGER * (12 - i));
  END LOOP;
  
  digit2 := 11 - (sum2 % 11);
  IF digit2 >= 10 THEN
    digit2 := 0;
  END IF;
  
  -- Verificar dígitos
  RETURN (substring(cpf_clean from 10 for 1)::INTEGER = digit1) AND 
         (substring(cpf_clean from 11 for 1)::INTEGER = digit2);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.validate_cnpj(cnpj TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  cnpj_clean TEXT;
  digit1 INTEGER;
  digit2 INTEGER;
  sum1 INTEGER := 0;
  sum2 INTEGER := 0;
  weights1 INTEGER[] := ARRAY[5,4,3,2,9,8,7,6,5,4,3,2];
  weights2 INTEGER[] := ARRAY[6,5,4,3,2,9,8,7,6,5,4,3,2];
  i INTEGER;
BEGIN
  -- Remover caracteres não numéricos
  cnpj_clean := regexp_replace(cnpj, '[^0-9]', '', 'g');
  
  -- Verificar se tem 14 dígitos
  IF length(cnpj_clean) != 14 THEN
    RETURN FALSE;
  END IF;
  
  -- Calcular primeiro dígito verificador
  FOR i IN 1..12 LOOP
    sum1 := sum1 + (substring(cnpj_clean from i for 1)::INTEGER * weights1[i]);
  END LOOP;
  
  digit1 := sum1 % 11;
  IF digit1 < 2 THEN
    digit1 := 0;
  ELSE
    digit1 := 11 - digit1;
  END IF;
  
  -- Calcular segundo dígito verificador
  FOR i IN 1..13 LOOP
    sum2 := sum2 + (substring(cnpj_clean from i for 1)::INTEGER * weights2[i]);
  END LOOP;
  
  digit2 := sum2 % 11;
  IF digit2 < 2 THEN
    digit2 := 0;
  ELSE
    digit2 := 11 - digit2;
  END IF;
  
  -- Verificar dígitos
  RETURN (substring(cnpj_clean from 13 for 1)::INTEGER = digit1) AND 
         (substring(cnpj_clean from 14 for 1)::INTEGER = digit2);
END;
$$ LANGUAGE plpgsql;
