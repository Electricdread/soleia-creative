CREATE OR REPLACE FUNCTION public.get_rate_card_categories()
RETURNS TABLE(name text, intro text, sort_order integer)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.name, c.intro, c.sort_order
    FROM public.line_item_categories c
   ORDER BY c.sort_order NULLS LAST, c.name;
$$;

GRANT EXECUTE ON FUNCTION public.get_rate_card_categories() TO anon, authenticated;