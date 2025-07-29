-- CRITICAL SECURITY FIXES (Drop existing policies first)

-- 1. Drop all existing policies on user_roles and user_module_permissions
DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles;
DROP POLICY IF EXISTS "Users can insert their own role" ON public.user_roles;
DROP POLICY IF EXISTS "Users can update their own role" ON public.user_roles;
DROP POLICY IF EXISTS "Users can delete their own role" ON public.user_roles;
DROP POLICY IF EXISTS "Only admins can insert user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only admins can update user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only admins can delete user roles" ON public.user_roles;

DROP POLICY IF EXISTS "Users can view their own module permissions" ON public.user_module_permissions;
DROP POLICY IF EXISTS "Users can insert their own module permissions" ON public.user_module_permissions;
DROP POLICY IF EXISTS "Users can update their own module permissions" ON public.user_module_permissions;
DROP POLICY IF EXISTS "Users can delete their own module permissions" ON public.user_module_permissions;
DROP POLICY IF EXISTS "Only admins can manage user module permissions" ON public.user_module_permissions;

-- 2. Create secure admin-only role assignment policies
CREATE POLICY "Only admins can insert user roles" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Only admins can update user roles" 
ON public.user_roles 
FOR UPDATE 
USING (public.is_admin(auth.uid()));

CREATE POLICY "Only admins can delete user roles" 
ON public.user_roles 
FOR DELETE 
USING (public.is_admin(auth.uid()));

CREATE POLICY "Users can view their own role" 
ON public.user_roles 
FOR SELECT 
USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- 3. Secure user_module_permissions table
CREATE POLICY "Only admins can manage user module permissions" 
ON public.user_module_permissions 
FOR ALL 
USING (public.is_admin(auth.uid()));

CREATE POLICY "Users can view their own module permissions" 
ON public.user_module_permissions 
FOR SELECT 
USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- 4. Add audit logging table for security monitoring (if not exists)
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on audit log
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- Drop existing audit policies if they exist
DROP POLICY IF EXISTS "Only admins can view audit logs" ON public.security_audit_log;
DROP POLICY IF EXISTS "System can insert audit logs" ON public.security_audit_log;

-- Create audit log policies
CREATE POLICY "Only admins can view audit logs" 
ON public.security_audit_log 
FOR SELECT 
USING (public.is_admin(auth.uid()));

CREATE POLICY "System can insert audit logs" 
ON public.security_audit_log 
FOR INSERT 
WITH CHECK (true);