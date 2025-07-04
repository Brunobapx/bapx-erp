-- Remover sistema completo de usuários e perfis - Parte 2: Tabelas e funções

-- Dropar triggers primeiro
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS audit_user_roles_trigger ON public.user_roles;

-- Dropar todas as policies de tabelas de usuários
DROP POLICY IF EXISTS "Allow unauthenticated to view pending invitations" ON public.user_invitations;
DROP POLICY IF EXISTS "Allow unauthenticated to accept invitations" ON public.user_invitations;
DROP POLICY IF EXISTS "Allow unauthenticated profile creation via invitation" ON public.profiles;
DROP POLICY IF EXISTS "Allow unauthenticated role creation via invitation" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage company user_invitations" ON public.user_invitations;
DROP POLICY IF EXISTS "Master users can create invitations" ON public.user_invitations;
DROP POLICY IF EXISTS "Master users can delete invitations" ON public.user_invitations;
DROP POLICY IF EXISTS "Master users can update invitations" ON public.user_invitations;
DROP POLICY IF EXISTS "Master users can view all invitations" ON public.user_invitations;
DROP POLICY IF EXISTS "Users can view company user_invitations" ON public.user_invitations;
DROP POLICY IF EXISTS "Admins can manage company user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins e masters podem gerenciar roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage profiles from their company" ON public.access_profiles;
DROP POLICY IF EXISTS "Users can view profiles from their company" ON public.access_profiles;
DROP POLICY IF EXISTS "Admins can manage profile modules from their company" ON public.profile_modules;
DROP POLICY IF EXISTS "Users can view profile modules from their company" ON public.profile_modules;
DROP POLICY IF EXISTS "Masters can view audit logs" ON public.security_audit_log;

-- Dropar tabelas relacionadas a usuários
DROP TABLE IF EXISTS public.user_invitations CASCADE;
DROP TABLE IF EXISTS public.profile_modules CASCADE;
DROP TABLE IF EXISTS public.access_profiles CASCADE;  
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.security_audit_log CASCADE;

-- Dropar funções relacionadas a usuários com CASCADE
DROP FUNCTION IF EXISTS public.create_user_profile_and_role CASCADE;
DROP FUNCTION IF EXISTS public.has_role CASCADE;
DROP FUNCTION IF EXISTS public.get_current_user_role CASCADE;
DROP FUNCTION IF EXISTS public.get_current_user_company_id CASCADE;
DROP FUNCTION IF EXISTS public.has_company_role CASCADE;
DROP FUNCTION IF EXISTS public.user_is_master CASCADE;
DROP FUNCTION IF EXISTS public.user_is_admin CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user_role CASCADE;
DROP FUNCTION IF EXISTS public.log_security_event CASCADE;
DROP FUNCTION IF EXISTS public.audit_user_roles CASCADE;
DROP FUNCTION IF EXISTS public.create_user_with_profile CASCADE;
DROP FUNCTION IF EXISTS public.get_company_users CASCADE;
DROP FUNCTION IF EXISTS public.user_has_module_access CASCADE;
DROP FUNCTION IF EXISTS public.audit_table_changes CASCADE;
DROP FUNCTION IF EXISTS public.setup_user_modules_on_role_creation CASCADE;
DROP FUNCTION IF EXISTS public.get_user_company CASCADE;
DROP FUNCTION IF EXISTS public.cleanup_user_data CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user CASCADE;

-- Dropar enum
DROP TYPE IF EXISTS app_role CASCADE;