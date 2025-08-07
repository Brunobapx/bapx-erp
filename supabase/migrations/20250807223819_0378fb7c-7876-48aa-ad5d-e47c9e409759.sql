-- Promote bruno@bapx.com.br to master role
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Find user by email in auth.users
  SELECT id INTO v_user_id
  FROM auth.users 
  WHERE email = 'bruno@bapx.com.br' AND deleted_at IS NULL
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário com email % não encontrado', 'bruno@bapx.com.br';
  END IF;

  -- Upsert role to 'master'
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = v_user_id) THEN
    UPDATE public.user_roles
      SET role = 'master'
      WHERE user_id = v_user_id;
  ELSE
    INSERT INTO public.user_roles (user_id, role)
    VALUES (v_user_id, 'master');
  END IF;
END $$;