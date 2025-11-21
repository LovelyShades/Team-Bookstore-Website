-- Add sale percentage field to items table
ALTER TABLE public.items 
ADD COLUMN sale_percentage numeric CHECK (sale_percentage >= 0 AND sale_percentage <= 100);

-- Add comment for clarity
COMMENT ON COLUMN public.items.sale_percentage IS 'Percentage off the regular price (0-100)';