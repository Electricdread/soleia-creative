-- Being assignable is not the same as being an admin.
--
-- Revoking admin from Amanda, Michelle, Jeff and Rivka took them out of the
-- assignee picker too, because `list_admin_users` — the RPC behind it — listed
-- exactly the admins. Their existing assignments and mail were never at risk:
-- `job_assignees` snapshots the address and the notification functions read it
-- with the service role, so neither consults a role. But nobody could put them
-- on a *new* job, or re-add one who had been removed, which is not what taking
-- away portal access was meant to do.
--
-- So the two ideas get separate roles. `admin` stays what it has always been:
-- the portal, and every has_role(auth.uid(), 'admin') policy. `pm` says only
-- that this person can be assigned work and mailed about it.

ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'pm';
