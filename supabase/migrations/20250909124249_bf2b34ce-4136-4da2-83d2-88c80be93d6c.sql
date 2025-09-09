-- Fix Cart Sessions Security - Remove dangerous public access policy
DROP POLICY IF EXISTS "Public cart access" ON public.cart_sessions;

-- Create proper session-based RLS policy for cart sessions
CREATE POLICY "Users can only access their own cart session"
ON public.cart_sessions
FOR ALL
USING (session_id = current_setting('request.header.x-session-id', true))
WITH CHECK (session_id = current_setting('request.header.x-session-id', true));

-- Secure System Configuration Data - Remove any public access to system modules
DROP POLICY IF EXISTS "Public can view system modules" ON public.system_modules;
DROP POLICY IF EXISTS "Public can view system sub modules" ON public.system_sub_modules;

-- Create authenticated-only policies for system modules
CREATE POLICY "Authenticated users can view system modules"
ON public.system_modules
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage system modules"
ON public.system_modules
FOR ALL
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Add proper RLS for system_sub_modules if it exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'system_sub_modules') THEN
        EXECUTE 'CREATE POLICY "Authenticated users can view system sub modules"
                ON public.system_sub_modules
                FOR SELECT
                USING (auth.uid() IS NOT NULL)';
        
        EXECUTE 'CREATE POLICY "Admins can manage system sub modules"
                ON public.system_sub_modules
                FOR ALL
                USING (is_admin(auth.uid()))
                WITH CHECK (is_admin(auth.uid()))';
    END IF;
END
$$;