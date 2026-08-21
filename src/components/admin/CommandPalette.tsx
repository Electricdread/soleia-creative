import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from '@/components/ui/command';
import { supabase } from '@/integrations/supabase/client';
import {
  FileText, BookOpen, Palette, LayoutDashboard, Calendar, HardDrive, Users, Mail, Loader2,
  Briefcase,
} from 'lucide-react';
import { modKey } from '@/lib/platform';

type RecordKind = 'job' | 'proposal' | 'packet' | 'session';

interface SearchRecord {
  kind: RecordKind;
  id: string;
  /** What the record is called on its own screen. */
  title: string;
  /** Client, status, date — whatever tells them apart at a glance. */
  detail: string;
  /** Where the admin list lives. */
  href: string;
  /** The client-facing token page, opened with the modifier + ↵. */
  publicHref: string | null;
  /**
   * Every name this job is filed under. The same job is routinely typed three
   * different ways — Ascend/MRI, Interstate15/G2E, MOC&CO x ZAXBYS/525
   * Productions — so matching only one field finds only one third of the work.
   */
  haystack: string;
}

const KIND_META: Record<RecordKind, { icon: typeof FileText; label: string }> = {
  job: { icon: Briefcase, label: 'Jobs' },
  proposal: { icon: FileText, label: 'Proposals' },
  packet: { icon: BookOpen, label: 'Packets' },
  session: { icon: Palette, label: 'Creative sessions' },
};

const PAGES = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Jobs', href: '/admin/jobs', icon: Briefcase },
  { label: 'Calendar', href: '/admin/calendar', icon: Calendar },
  { label: 'Packets', href: '/admin/packets', icon: BookOpen },
  { label: 'Proposals', href: '/admin/proposals', icon: FileText },
  { label: 'Creative sessions', href: '/admin/creative', icon: Palette },
  { label: 'Storage', href: '/admin/storage', icon: HardDrive },
  { label: 'People', href: '/admin/users', icon: Users },
  { label: 'Email previews', href: '/admin/email-previews', icon: Mail },
];

const norm = (v: string) => v.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

/**
 * Cached for the session, not per mount.
 *
 * AdminShell is mounted fresh by every page, so the palette was reloading all
 * three tables the first time it opened on each one — you paid the round trip
 * again after every navigation, while looking at a spinner.
 */
let cache: SearchRecord[] | null = null;
let inFlight: Promise<SearchRecord[]> | null = null;

async function loadRecords(): Promise<SearchRecord[]> {
  if (cache) return cache;
  if (inFlight) return inFlight;

  inFlight = (async () => {
    const [jobs, proposals, packets, sessions] = await Promise.all([
      supabase.from('jobs')
        .select('id, title, client_name, event_date, track, is_active'),
      supabase.from('proposals')
        .select('id, token, event_name, client_name, event_date, status, signed_at, is_active'),
      supabase.from('pre_call_packets')
        .select('id, token, title, client_name, event_date, kind, is_active'),
      supabase.from('creative_sessions')
        .select('id, token, project_name, client_name, event_date, is_active, is_public'),
    ]);

    const all: SearchRecord[] = [];

    // Jobs lead: one result standing for every record under it.
    (jobs.data ?? []).forEach((j) => {
      all.push({
        kind: 'job',
        id: j.id,
        title: j.title,
        detail: [j.client_name !== j.title ? j.client_name : null,
                 j.track === 'in_house' ? 'in-house' : null,
                 j.event_date, j.is_active ? null : 'past'].filter(Boolean).join(' · '),
        href: `/admin/jobs/${j.id}`,
        publicHref: null,
        haystack: norm([j.title, j.client_name].filter(Boolean).join(' ')),
      });
    });

    (proposals.data ?? []).forEach((p) => {
      const status = p.signed_at ? 'signed' : (p.status ?? 'draft');
      all.push({
        kind: 'proposal',
        id: p.id,
        title: p.event_name,
        detail: [p.client_name, status, p.event_date, p.is_active ? null : 'archived']
          .filter(Boolean).join(' · '),
        href: `/admin/proposals?focus=${p.id}`,
        publicHref: p.token ? `/proposal/${p.token}` : null,
        haystack: norm([p.event_name, p.client_name, status].filter(Boolean).join(' ')),
      });
    });

    (packets.data ?? []).forEach((p) => {
      all.push({
        kind: 'packet',
        id: p.id,
        title: p.title,
        detail: [p.client_name, p.kind?.replace(/_/g, ' '), p.event_date, p.is_active ? null : 'archived']
          .filter(Boolean).join(' · '),
        href: `/admin/packets?focus=${p.id}`,
        publicHref: p.token ? `/packet/${p.token}` : null,
        haystack: norm([p.title, p.client_name].filter(Boolean).join(' ')),
      });
    });

    (sessions.data ?? []).forEach((s) => {
      all.push({
        kind: 'session',
        id: s.id,
        title: s.project_name,
        detail: [s.client_name, s.is_public ? 'public' : 'private', s.event_date, s.is_active ? null : 'archived']
          .filter(Boolean).join(' · '),
        href: `/admin/creative?focus=${s.id}`,
        publicHref: s.token ? `/creative/${s.token}` : null,
        haystack: norm([s.project_name, s.client_name].filter(Boolean).join(' ')),
      });
    });

    cache = all;
    inFlight = null;
    return all;
  })();

  return inFlight;
}

/** Warm the cache before anyone presses the shortcut. */
export async function prefetchPaletteRecords(): Promise<void> {
  try {
    await loadRecords();
  } catch (e) {
    console.error('CommandPalette prefetch failed', e);
  }
}

/** Drop the cache so the next open re-reads — call after creating or deleting. */
export function invalidatePaletteRecords(): void {
  cache = null;
  inFlight = null;
}

export interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const navigate = useNavigate();
  const [records, setRecords] = useState<SearchRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');

  // Records come from the session cache, which AdminShell warms on mount, so
  // pressing the shortcut normally shows results with no wait at all.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    if (cache) { setRecords(cache); setLoading(false); return; }

    setLoading(true);
    loadRecords()
      .then((rows) => { if (!cancelled) setRecords(rows); })
      .catch((e) => console.error('CommandPalette load failed', e))
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [open]);

  // cmdk's own scoring only sees the visible label, which would miss a job
  // filed under its other name. Filter here on the full haystack instead.
  const matches = useMemo(() => {
    const q = norm(query);
    if (!q) return records.slice(0, 8);
    const terms = q.split(' ').filter(Boolean);
    return records.filter((r) => terms.every((t) => r.haystack.includes(t))).slice(0, 24);
  }, [query, records]);

  const grouped = useMemo(() => {
    const out: Record<RecordKind, SearchRecord[]> = { job: [], proposal: [], packet: [], session: [] };
    matches.forEach((m) => out[m.kind].push(m));
    return out;
  }, [matches]);

  const go = (record: SearchRecord) => {
    onOpenChange(false);
    setQuery('');
    navigate(record.href);
  };

  // cmdk does not hand the originating event to onSelect, so modifier+Enter is
  // read off the input before cmdk's own Enter handling reaches the root.
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter' || !(e.metaKey || e.ctrlKey)) return;
    const selected = document.querySelector<HTMLElement>('[cmdk-item][aria-selected="true"]');
    const href = selected?.dataset.publicHref;
    if (!href) return;
    e.preventDefault();
    e.stopPropagation();
    onOpenChange(false);
    setQuery('');
    window.open(href, '_blank', 'noopener');
  };

  const pageMatches = useMemo(() => {
    const q = norm(query);
    if (!q) return PAGES;
    return PAGES.filter((p) => norm(p.label).includes(q));
  }, [query]);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} shouldFilter={false}>
      <CommandInput
        placeholder="Search jobs, clients, events…"
        value={query}
        onValueChange={setQuery}
        onKeyDown={handleKeyDown}
      />
      <CommandList>
        {loading && (
          <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading records…
          </div>
        )}

        {!loading && <CommandEmpty>Nothing matches that.</CommandEmpty>}

        {(Object.keys(grouped) as RecordKind[]).map((kind) => {
          const items = grouped[kind];
          if (items.length === 0) return null;
          const Icon = KIND_META[kind].icon;
          return (
            <CommandGroup key={kind} heading={KIND_META[kind].label}>
              {items.map((r) => (
                <CommandItem
                  key={`${kind}-${r.id}`}
                  value={`${kind}-${r.id}-${r.haystack}`}
                  onSelect={() => go(r)}
                  data-public-href={r.publicHref ?? undefined}
                  className="gap-3"
                >
                  <Icon className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1 truncate">
                    <span className="font-medium text-foreground">{r.title}</span>
                    {r.detail && <span className="ml-2 text-xs text-muted-foreground">{r.detail}</span>}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          );
        })}

        {pageMatches.length > 0 && (
          <CommandGroup heading="Go to">
            {pageMatches.map((p) => {
              const Icon = p.icon;
              return (
                <CommandItem
                  key={p.href}
                  value={`page ${p.label}`}
                  onSelect={() => { onOpenChange(false); setQuery(''); navigate(p.href); }}
                  className="gap-3"
                >
                  <Icon className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                  <span>{p.label}</span>
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}
      </CommandList>

      <div className="flex flex-wrap items-center gap-4 border-t border-border px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        <span>↑↓ move</span>
        <span>↵ open</span>
        <span>{modKey} ↵ client page</span>
        <span>esc close</span>
      </div>
    </CommandDialog>
  );
}

export default CommandPalette;
