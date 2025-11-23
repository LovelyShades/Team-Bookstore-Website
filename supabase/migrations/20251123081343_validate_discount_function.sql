-- Create a function to validate discount codes (accessible to all authenticated users)
CREATE OR REPLACE FUNCTION public.fn_validate_discount(p_discount_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
declare
  v_discount record;
begin
  -- Fetch discount details with SECURITY DEFINER privileges
  SELECT code, pct_off, max_uses, used_count, expires_at, active
  INTO v_discount
  FROM public.discounts
  WHERE code = p_discount_code;

  -- If discount not found, return error
  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'error', 'INVALID_CODE');
  END IF;

  -- Check if discount is active
  IF NOT v_discount.active THEN
    RETURN jsonb_build_object('valid', false, 'error', 'INACTIVE');
  END IF;

  -- Check if discount has expired
  IF v_discount.expires_at IS NOT NULL AND v_discount.expires_at < now() THEN
    RETURN jsonb_build_object('valid', false, 'error', 'EXPIRED');
  END IF;

  -- Check if discount has reached usage limit
  IF v_discount.max_uses IS NOT NULL AND v_discount.used_count >= v_discount.max_uses THEN
    RETURN jsonb_build_object('valid', false, 'error', 'USAGE_LIMIT');
  END IF;

  -- Return valid discount info
  RETURN jsonb_build_object(
    'valid', true,
    'code', v_discount.code,
    'pct_off', v_discount.pct_off
  );
end;
$$;
