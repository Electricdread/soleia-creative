-- Grant `pm` to the four who were assignable as admins and still need to be.
--
-- A separate migration from the one adding the enum value, because Postgres
-- will not let a new label be used in the transaction that added it.
--
-- Matched by email through `profiles`, as the revocation was: the ids are
-- environment-specific, the addresses are the stable identity.

INSERT INTO public.user_roles (user_id, role)
SELECT p.user_id, 'pm'::public.app_role
  FROM public.profiles p
 WHERE p.email IN (
   'arodriguez@soleialv.com',
   'mdimond@soleialv.com',
   'jnovak360@gmail.com',
   'rivka@soleialv.com'
 )
ON CONFLICT (user_id, role) DO NOTHING;

-- Who can be put on a job: admins and PMs.
--
-- EXISTS rather than a join on role IN (...), so somebody holding both roles is
-- offered once instead of twice.
--
-- The name is left alone because the picker calls it by name and a rename would
-- break the app between deploys. The admin-only guard stays: this is still a
-- list only an admin may read.
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
   WHERE EXISTS (
           SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = p.user_id
              AND ur.role IN ('admin', 'pm')
         )
   ORDER BY p.email;
END;
$$;

COMMENT ON FUNCTION public.list_admin_users() IS
  'Colleagues who can be assigned to a job: admins and PMs. Named for the admin-only picker it still feeds; being listed here is not admin access, which is role = admin alone.';
