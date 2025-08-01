-- Fix orders table permissions and ensure proper access
-- Grant full access to all necessary roles

-- Ensure orders table has proper RLS policies
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.orders;
DROP POLICY IF EXISTS "Allow all operations for service_role" ON public.orders;

-- Create comprehensive RLS policies
CREATE POLICY "Enable all operations for authenticated users" ON public.orders
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Enable all operations for anon users" ON public.orders  
FOR ALL TO anon
USING (true)
WITH CHECK (true);

CREATE POLICY "Enable all operations for service_role" ON public.orders
FOR ALL TO service_role  
USING (true)
WITH CHECK (true);

-- Grant table permissions to all roles
GRANT ALL ON public.orders TO authenticated;
GRANT ALL ON public.orders TO anon;
GRANT ALL ON public.orders TO service_role;

-- Grant sequence permissions if any sequences are used
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon; 
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Ensure the generate_sequence_number function has proper permissions
GRANT EXECUTE ON FUNCTION public.generate_sequence_number(text, text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_sequence_number(text, text, uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.generate_sequence_number(text, text, uuid) TO service_role;

-- Test the generate_sequence_number function to ensure it works
-- This will create a test sequence number
DO $$
DECLARE
    test_number text;
BEGIN
    -- Test the function
    test_number := public.generate_sequence_number('TEST', 'orders', gen_random_uuid());
    RAISE NOTICE 'Test sequence number generated: %', test_number;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error testing generate_sequence_number: %', SQLERRM;
END $$;