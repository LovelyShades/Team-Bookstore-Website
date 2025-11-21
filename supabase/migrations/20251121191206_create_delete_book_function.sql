-- Create a function to delete books with CASCADE behavior
-- This function runs with SECURITY DEFINER to bypass RLS policies

CREATE OR REPLACE FUNCTION public.fn_delete_book(p_book_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete from cart_items first
  DELETE FROM public.cart_items WHERE item_id = p_book_id;

  -- Delete from order_items
  DELETE FROM public.order_items WHERE item_id = p_book_id;

  -- Finally delete the book
  DELETE FROM public.items WHERE id = p_book_id;
END;
$$;

-- Create a function to delete multiple books
CREATE OR REPLACE FUNCTION public.fn_delete_books(p_book_ids uuid[])
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete from cart_items first
  DELETE FROM public.cart_items WHERE item_id = ANY(p_book_ids);

  -- Delete from order_items
  DELETE FROM public.order_items WHERE item_id = ANY(p_book_ids);

  -- Finally delete the books
  DELETE FROM public.items WHERE id = ANY(p_book_ids);
END;
$$;
