import { supabase } from '@/integrations/supabase/client';

/**
 * Admin-side access to the creative briefs clients fill in inside their session.
 *
 * Clients write through token RPCs; admins read the table directly under the
 * admin-only RLS policy. The generated Supabase types are checked in and do not
 * yet include this table, so the single cast lives here rather than in every
 * component that needs a brief.
 */

export interface CreativeBriefRow {
  id: string;
  client_link_id: string;
  mood: string | null;
  vibe: string | null;
  color_scheme: string | null;
  avoid: string | null;
  elevator_mode: string | null;
  elevator_up: string | null;
  elevator_down: string | null;
  transforms_to_party: string | null;
  looks_count: number | null;
  notes: string | null;
  submitted_at: string | null;
  updated_at: string | null;
}

const briefTable = () =>
  (supabase as unknown as {
    from: (t: string) => {
      select: (cols: string) => {
        in: (col: string, vals: string[]) => Promise<{ data: CreativeBriefRow[] | null }>;
        eq: (col: string, val: string) => {
          maybeSingle: () => Promise<{ data: CreativeBriefRow | null }>;
        };
      };
    };
  }).from('creative_briefs');

export const ELEVATOR_LABEL: Record<string, string> = {
  messages: 'Greet guests — ride up / ride down messages',
  branding_loop: 'Branding loop',
  undecided: 'Undecided — bring a recommendation',
};

export const PARTY_LABEL: Record<string, string> = {
  yes: 'Yes — turns over to a party',
  no: 'No — one tone throughout',
  unsure: 'Not sure yet',
};

/** How many of the seven questions carry an answer. */
export function answeredCount(b: CreativeBriefRow): number {
  return [
    b.mood,
    b.vibe,
    b.color_scheme,
    b.avoid,
    b.elevator_mode,
    b.transforms_to_party,
    b.looks_count ? String(b.looks_count) : null,
  ].filter((v) => String(v ?? '').trim().length > 0).length;
}

export async function fetchBriefsForLinks(linkIds: string[]): Promise<Record<string, CreativeBriefRow>> {
  if (linkIds.length === 0) return {};
  const { data } = await briefTable().select('*').in('client_link_id', linkIds);
  const map: Record<string, CreativeBriefRow> = {};
  for (const row of data || []) map[row.client_link_id] = row;
  return map;
}

export async function fetchBriefForLink(linkId: string): Promise<CreativeBriefRow | null> {
  const { data } = await briefTable().select('*').eq('client_link_id', linkId).maybeSingle();
  return data ?? null;
}

/**
 * The brief as plain text, for pasting into a creative call agenda, a project
 * note or a hand-off to whoever builds the looks.
 */
export function briefToPlainText(b: CreativeBriefRow, heading: string): string {
  const line = (label: string, value: string | null | undefined) =>
    value && String(value).trim() ? `${label}\n${String(value).trim()}\n` : '';

  const elevator = b.elevator_mode ? ELEVATOR_LABEL[b.elevator_mode] || b.elevator_mode : '';
  const rides = [
    b.elevator_up ? `  Ride up: ${b.elevator_up}` : '',
    b.elevator_down ? `  Ride down: ${b.elevator_down}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  return [
    `CREATIVE BRIEF — ${heading}`,
    '',
    line('MOOD', b.mood),
    line('VIBE', b.vibe),
    line('COLOUR SCHEME', b.color_scheme),
    line('AVOID', b.avoid),
    elevator ? `ELEVATOR\n${elevator}${rides ? `\n${rides}` : ''}\n` : '',
    line('TURNS TO PARTY', b.transforms_to_party ? PARTY_LABEL[b.transforms_to_party] : null),
    line('LOOKS', b.looks_count ? `${b.looks_count}` : null),
    line('NOTES', b.notes),
  ]
    .filter(Boolean)
    .join('\n')
    .trim();
}
