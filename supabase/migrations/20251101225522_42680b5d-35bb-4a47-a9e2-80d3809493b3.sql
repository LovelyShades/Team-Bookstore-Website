-- Clean up test data
-- First delete all order_items (removes foreign key constraint blocking)
DELETE FROM order_items;

-- Then delete all orders
DELETE FROM orders;

-- Finally delete all cart_items (in case any exist)
DELETE FROM cart_items;

-- Delete all carts
DELETE FROM carts;

-- Now we can safely delete all items/books
DELETE FROM items;