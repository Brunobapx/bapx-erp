-- Force PostgREST schema reload by updating a system setting
-- This should refresh the API cache without dropping the table

-- Check if table exists and is accessible
SELECT COUNT(*) as table_exists FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'orders';

-- Force PostgREST to reload schema by sending notification
NOTIFY pgrst, 'reload schema';