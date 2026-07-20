CREATE OR REPLACE FUNCTION public.get_rate_card_addons()
RETURNS TABLE(id uuid, title text, price numeric, category text, ideal_for text, long_description text, deliverables text[], sort_order integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT t.id, t.title, t.price, t.category, t.ideal_for, t.long_description, t.deliverables, t.sort_order
    FROM public.line_item_templates t
   WHERE t.title NOT ILIKE '%Immersive LED Environments%'
   ORDER BY t.category NULLS LAST, t.sort_order NULLS LAST, t.title;
$$;

GRANT EXECUTE ON FUNCTION public.get_rate_card_addons() TO anon, authenticated;