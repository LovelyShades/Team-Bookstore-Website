-- Fix foreign key constraint to allow deleting books that are in carts
-- Drop existing foreign key constraint
ALTER TABLE cart_items DROP CONSTRAINT IF EXISTS cart_items_item_id_fkey;

-- Add foreign key constraint with CASCADE delete
-- When a book (item) is deleted, all cart_items referencing it will be automatically deleted
ALTER TABLE cart_items
ADD CONSTRAINT cart_items_item_id_fkey
FOREIGN KEY (item_id)
REFERENCES items(id)
ON DELETE CASCADE;
