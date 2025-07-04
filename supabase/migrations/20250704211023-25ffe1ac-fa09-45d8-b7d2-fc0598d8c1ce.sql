-- Criar função para criar perfil e role em transação
CREATE OR REPLACE FUNCTION public.create_user_profile_and_role(
  p_user_id UUID,
  p_first_name TEXT,
  p_last_name TEXT,
  p_company_id UUID,
  p_role app_role,
  p_invitation_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Inserir perfil
  INSERT INTO public.profiles (
    id, 
    first_name, 
    last_name, 
    company_id, 
    is_active
  ) VALUES (
    p_user_id,
    p_first_name,
    p_last_name,
    p_company_id,
    true
  );
  
  -- Inserir role
  INSERT INTO public.user_roles (
    user_id,
    role,
    company_id
  ) VALUES (
    p_user_id,
    p_role,
    p_company_id
  );
  
  -- Marcar convite como aceito
  UPDATE public.user_invitations 
  SET status = 'accepted' 
  WHERE id = p_invitation_id;
  
  -- Log da criação
  PERFORM public.log_security_event(
    'USER_CREATED_VIA_INVITATION', 
    'profiles', 
    p_user_id, 
    NULL, 
    jsonb_build_object(
      'user_id', p_user_id,
      'company_id', p_company_id,
      'role', p_role,
      'invitation_id', p_invitation_id
    )
  );
END;
$$;

-- Permitir que usuários não autenticados aceitem convites
CREATE POLICY "Allow unauthenticated to view pending invitations"
ON public.user_invitations
FOR SELECT
TO anon
USING (status = 'pending' AND expires_at > now());

-- Permitir que usuários não autenticados atualizem convites para aceito
CREATE POLICY "Allow unauthenticated to accept invitations"
ON public.user_invitations
FOR UPDATE
TO anon
USING (status = 'pending' AND expires_at > now())
WITH CHECK (status = 'accepted');

-- Permitir que usuários não autenticados criem perfis via convite
CREATE POLICY "Allow unauthenticated profile creation via invitation"
ON public.profiles
FOR INSERT
TO anon
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_invitations 
    WHERE email IN (
      SELECT email FROM auth.users WHERE id = profiles.id
    ) 
    AND status = 'pending' 
    AND expires_at > now()
  )
);

-- Permitir que usuários não autenticados criem roles via convite
CREATE POLICY "Allow unauthenticated role creation via invitation"
ON public.user_roles
FOR INSERT
TO anon
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_invitations ui
    JOIN auth.users au ON au.email = ui.email
    WHERE au.id = user_roles.user_id
    AND ui.status = 'pending' 
    AND ui.expires_at > now()
  )
);