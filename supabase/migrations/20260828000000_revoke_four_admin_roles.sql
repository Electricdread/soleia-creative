-- Amanda, Michelle, Jeff and Rivka are no longer admins.
--
-- Only the `admin` row is dropped. Each of them keeps their account, their
-- profile and their `user` role, so this is a revocation and not a deletion —
-- re-granting is a single insert if any of them needs the portal back.
--
-- Admin access is gated solely on a `user_roles` row with role = 'admin'
-- (see `has_role` and `useAuth.checkAdminRole`), so dropping that row is the
-- whole revocation; there is no separate allowlist to keep in step.
--
-- Matched by email through `profiles` rather than by user id, because the ids
-- are environment-specific while the addresses are the stable identity. Note
-- that with the admin role gone they appear as pending on /admin/users, which
-- is the same state any not-yet-approved signup is in.

delete from public.user_roles ur
 using public.profiles p
 where p.user_id = ur.user_id
   and ur.role = 'admin'
   and p.email in (
     'arodriguez@soleialv.com',
     'mdimond@soleialv.com',
     'jnovak360@gmail.com',
     'rivka@soleialv.com'
   );
