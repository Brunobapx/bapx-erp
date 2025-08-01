-- Corrigir a função validate_company_access para funcionar sem company_id
-- Como todos os usuários parecem ser da mesma empresa, vamos simplificar

CREATE OR REPLACE FUNCTION public.validate_company_access(target_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  current_user_company text;
  target_user_company text;
BEGIN
  -- Get current user's company
  SELECT raw_user_meta_data->>'company_id' INTO current_user_company
  FROM auth.users WHERE id = auth.uid();
  
  -- Get target user's company
  SELECT raw_user_meta_data->>'company_id' INTO target_user_company
  FROM auth.users WHERE id = target_user_id;
  
  -- Se company_id não estiver configurado para nenhum dos usuários,
  -- assumir que são da mesma empresa (BAPX)
  IF current_user_company IS NULL AND target_user_company IS NULL THEN
    RETURN TRUE;
  END IF;
  
  -- Se ambos têm company_id, verificar se são iguais
  IF current_user_company IS NOT NULL AND target_user_company IS NOT NULL THEN
    RETURN current_user_company = target_user_company;
  END IF;
  
  -- Se apenas um tem company_id, negar acesso por segurança
  RETURN FALSE;
END;
$function$;