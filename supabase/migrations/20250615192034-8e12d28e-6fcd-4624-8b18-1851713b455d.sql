
-- POLÍTICAS RLS PARA AS TABELAS CRÍTICAS

-- PERFIS: Usuário só vê/edita seu próprio perfil
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuário vê apenas seu perfil" ON public.profiles;
CREATE POLICY "Usuário vê apenas seu perfil"
  ON public.profiles
  FOR SELECT
  USING (id = auth.uid());

DROP POLICY IF EXISTS "Usuário pode atualizar seu perfil" ON public.profiles;
CREATE POLICY "Usuário pode atualizar seu perfil"
  ON public.profiles
  FOR UPDATE
  USING (id = auth.uid());

DROP POLICY IF EXISTS "Usuário pode deletar seu perfil" ON public.profiles;
CREATE POLICY "Usuário pode deletar seu perfil"
  ON public.profiles
  FOR DELETE
  USING (id = auth.uid());

DROP POLICY IF EXISTS "Usuário pode criar perfil próprio (gatilho)" ON public.profiles;
CREATE POLICY "Usuário pode criar perfil próprio (gatilho)"
  ON public.profiles
  FOR INSERT
  WITH CHECK (id = auth.uid());

-- USER_ROLES: Apenas admin/master alteram, usuário só vê a si mesmo
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuários veem suas roles" ON public.user_roles;
CREATE POLICY "Usuários veem suas roles"
  ON public.user_roles
  FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins e masters podem gerenciar roles" ON public.user_roles;
CREATE POLICY "Admins e masters podem gerenciar roles"
  ON public.user_roles
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'master'));

-- SYSTEM_SETTINGS: Só admin/master podem ler, inserir e modificar
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins/masters podem ver/configurar" ON public.system_settings;
CREATE POLICY "Admins/masters podem ver/configurar"
  ON public.system_settings
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'master'));

