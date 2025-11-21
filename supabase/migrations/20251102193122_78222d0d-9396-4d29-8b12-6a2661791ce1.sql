-- Fix: Restrict discount code access to admins only
-- The fn_checkout function already validates discount codes server-side with SECURITY DEFINER,
-- so public read access is unnecessary and exposes business intelligence

-- Remove the overly permissive public read policy
DROP POLICY IF EXISTS "discounts_read" ON public.discounts;

-- Create admin-only read policy
CREATE POLICY "discounts_admin_read" ON public.discounts
  FOR SELECT
  USING (is_admin(auth.uid()));