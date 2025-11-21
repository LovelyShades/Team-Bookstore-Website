-- Force CASCADE delete on ALL foreign keys related to items table
-- This ensures books can be deleted even if they're in carts or orders

-- Fix cart_items foreign key
ALTER TABLE cart_items DROP CONSTRAINT IF EXISTS cart_items_item_id_fkey;
ALTER TABLE cart_items
ADD CONSTRAINT cart_items_item_id_fkey
FOREIGN KEY (item_id)
REFERENCES items(id)
ON DELETE CASCADE;

-- Fix order_items foreign key (in case books are in completed orders)
ALTER TABLE order_items DROP CONSTRAINT IF EXISTS order_items_item_id_fkey;
ALTER TABLE order_items
ADD CONSTRAINT order_items_item_id_fkey
FOREIGN KEY (item_id)
REFERENCES items(id)
ON DELETE CASCADE;
