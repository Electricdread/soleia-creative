CREATE OR REPLACE FUNCTION public.admin_reorder_rate_card_items(p_items jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  UPDATE public.line_item_templates t
     SET sort_order = (elem->>'sort_order')::int
    FROM jsonb_array_elements(p_items) elem
   WHERE t.id = (elem->>'id')::uuid;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_reorder_rate_card_items(jsonb) TO authenticated;