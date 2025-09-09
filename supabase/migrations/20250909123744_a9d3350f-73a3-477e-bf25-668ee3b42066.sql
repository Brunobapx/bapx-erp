-- Remove the dangerous public read policy on products table
DROP POLICY IF EXISTS "Public can view active products for e-commerce" ON public.products;

-- The products table should only be accessible by authenticated company users
-- The existing "Company isolation" policy already handles this properly
-- E-commerce functionality will use the public-catalog edge function with service role access