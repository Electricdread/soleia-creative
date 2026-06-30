
-- Add assigned PM and client email to proposals
ALTER TABLE public.proposals
  ADD COLUMN IF NOT EXISTS assigned_pm_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS assigned_pm_name text,
  ADD COLUMN IF NOT EXISTS assigned_pm_email text,
  ADD COLUMN IF NOT EXISTS client_email text;

-- RPC to list admin users for PM picker (admin-only)
CREATE OR REPLACE FUNCTION public.list_admin_users()
RETURNS TABLE(user_id uuid, email text, display_name text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  RETURN QUERY
  SELECT p.user_id, p.email, COALESCE(p.email, p.user_id::text) AS display_name
    FROM public.profiles p
    JOIN public.user_roles ur ON ur.user_id = p.user_id
   WHERE ur.role = 'admin'
   ORDER BY p.email;
END;
$$;

GRANT EXECUTE ON FUNCTION public.list_admin_users() TO authenticated;
