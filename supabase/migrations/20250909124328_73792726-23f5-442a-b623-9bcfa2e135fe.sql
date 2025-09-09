-- Fix Cart Sessions Security - Remove existing policies and create proper ones
DROP POLICY IF EXISTS "Public cart access" ON public.cart_sessions;
DROP POLICY IF EXISTS "Users can only access their own cart session" ON public.cart_sessions;

-- Create proper session-based RLS policy for cart sessions
CREATE POLICY "Session-based cart access"
ON public.cart_sessions
FOR ALL
USING (session_id = current_setting('request.header.x-session-id', true))
WITH CHECK (session_id = current_setting('request.header.x-session-id', true));

-- Secure System Configuration Data - Remove any public access to system modules
DROP POLICY IF EXISTS "Public can view system modules" ON public.system_modules;
DROP POLICY IF EXISTS "Authenticated users can view system modules" ON public.system_modules;
DROP POLICY IF EXISTS "Admins can manage system modules" ON public.system_modules;

-- Create authenticated-only policies for system modules
CREATE POLICY "Auth users view system modules"
ON public.system_modules
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins manage system modules"
ON public.system_modules
FOR ALL
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));