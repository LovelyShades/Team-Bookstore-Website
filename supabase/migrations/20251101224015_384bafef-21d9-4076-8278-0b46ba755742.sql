-- Fix security warnings from linter

-- 1. Add RLS policies for user_roles table
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage all roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- 2. Update function search paths for security
CREATE OR REPLACE FUNCTION public.set_unit_price_from_item()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
declare p numeric(10,2);
begin
  if new.unit_price is null then
    select price into p from public.items where id = new.item_id;
    new.unit_price := coalesce(p, 0);
  end if;
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.set_order_item_snapshots()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
begin
  if new.snapshot_isbn13 is null or new.snapshot_title is null then
    select i.isbn13, coalesce(i.title, i.name)
      into new.snapshot_isbn13, new.snapshot_title
    from public.items i
    where i.id = new.item_id;
  end if;
  return new;
end
$function$;