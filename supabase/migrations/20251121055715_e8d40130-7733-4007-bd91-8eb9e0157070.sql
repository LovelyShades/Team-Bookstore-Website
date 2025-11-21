-- Add sale fields to items table
ALTER TABLE public.items 
ADD COLUMN on_sale boolean NOT NULL DEFAULT false,
ADD COLUMN sale_price_cents integer,
ADD COLUMN sale_ends_at timestamp with time zone;

-- Add comment for clarity
COMMENT ON COLUMN public.items.on_sale IS 'Whether this item is currently on sale';
COMMENT ON COLUMN public.items.sale_price_cents IS 'Sale price in cents (must be less than regular price)';
COMMENT ON COLUMN public.items.sale_ends_at IS 'When the sale ends (optional)';

-- Create a trigger to validate sale price is less than regular price
CREATE OR REPLACE FUNCTION public.validate_sale_price()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.on_sale = true THEN
    -- Ensure sale_price_cents is provided and less than price_cents
    IF NEW.sale_price_cents IS NULL THEN
      RAISE EXCEPTION 'Sale price must be set when item is on sale';
    END IF;
    
    IF NEW.sale_price_cents >= NEW.price_cents THEN
      RAISE EXCEPTION 'Sale price must be less than regular price';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_item_sale_price
  BEFORE INSERT OR UPDATE ON public.items
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_sale_price();