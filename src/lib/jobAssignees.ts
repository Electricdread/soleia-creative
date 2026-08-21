import { supabase } from '@/integrations/supabase/client';
import type { Colleague } from '@/components/admin/AssigneePicker';

/**
 * Reading and writing who is on a job.
 *
 * Email and name are stored alongside user_id rather than joined at read time,
 * so a notification still knows where to send if a profile is renamed or
 * removed — the edge function reads this table and nothing else.
 */

export async function fetchJobAssignees(jobId: string): Promise<Colleague[]> {
  const { data, error } = await supabase
    .from('job_assignees')
    .select('user_id, email, display_name')
    .eq('job_id', jobId)
    .order('created_at');
  if (error) {
    console.error('Could not load who is on this job', error.message);
    return [];
  }
  return (data ?? []) as Colleague[];
}

/**
 * Make the job's assignees match `next` exactly.
 *
 * Diffed rather than deleted-and-reinserted, so created_at survives for people
 * who were already on it and the list keeps the order they were added in.
 */
export async function saveJobAssignees(
  jobId: string,
  next: Colleague[],
  createdBy?: string,
): Promise<boolean> {
  const current = await fetchJobAssignees(jobId);
  const currentIds = new Set(current.map((c) => c.user_id));
  const nextIds = new Set(next.map((c) => c.user_id));

  const toAdd = next.filter((c) => !currentIds.has(c.user_id));
  const toRemove = current.filter((c) => !nextIds.has(c.user_id));

  let ok = true;

  if (toAdd.length > 0) {
    const { error } = await supabase.from('job_assignees').insert(
      toAdd.map((c) => ({
        job_id: jobId,
        user_id: c.user_id,
        email: c.email,
        display_name: c.display_name,
        created_by: createdBy ?? null,
      })),
    );
    if (error) { console.error('Could not assign', error.message); ok = false; }
  }

  if (toRemove.length > 0) {
    const { error } = await supabase
      .from('job_assignees')
      .delete()
      .eq('job_id', jobId)
      .in('user_id', toRemove.map((c) => c.user_id));
    if (error) { console.error('Could not unassign', error.message); ok = false; }
  }

  return ok;
}
