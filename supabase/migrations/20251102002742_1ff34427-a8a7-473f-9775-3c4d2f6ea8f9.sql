-- Add featured column to items table
ALTER TABLE public.items 
ADD COLUMN featured boolean NOT NULL DEFAULT false;

-- Create index for better performance on featured queries
CREATE INDEX idx_items_featured ON public.items(featured) WHERE featured = true;

-- Update existing books: set the 3 newest active books as featured
WITH newest_books AS (
  SELECT id 
  FROM public.items 
  WHERE active = true 
  ORDER BY created_at DESC 
  LIMIT 3
)
UPDATE public.items 
SET featured = true 
WHERE id IN (SELECT id FROM newest_books);