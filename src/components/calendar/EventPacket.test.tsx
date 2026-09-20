import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const seen = vi.hoisted(() => ({
  initial: null as null | { title: string; client_name: string | null; event_date: string | null },
}));

// Every read answers "nothing there", which is all the Packet tab needs to render empty.
vi.mock('@/integrations/supabase/client', () => {
  const chain: Record<string, unknown> = {};
  for (const method of ['select', 'eq', 'in', 'order']) chain[method] = () => chain;
  chain.maybeSingle = () => Promise.resolve({ data: null });
  chain.then = (resolve: (value: { data: never[] }) => unknown) => Promise.resolve({ data: [] }).then(resolve);
  return { supabase: { from: () => chain, functions: { invoke: vi.fn() } } };
});

vi.mock('@/components/admin/PacketEditor', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/components/admin/PacketEditor')>();
  return {
    ...actual,
    PacketEditor: ({ initial }: { initial: typeof seen.initial }) => {
      seen.initial = initial;
      return null;
    },
  };
});

import { EventPacket } from './EventPacket';

describe('EventPacket', () => {
  it('raises a packet named "MM.DD.YY Client - Event", so its job and folder carry the same label', async () => {
    render(
      <EventPacket
        eventUid="uid-1"
        summary="[D] CR - NW Regional Office LIUNA"
        dtstart="2026-09-22T17:00:00"
        eventLabel="09.22.26 CR - NW Regional Office LIUNA"
      />,
    );

    fireEvent.click(await screen.findByRole('button', { name: 'Pre-Call Packet' }));

    // A job takes its title from its packet, so an undated packet title strips the day from the job too.
    expect(seen.initial?.title).toBe('09.22.26 CR - NW Regional Office LIUNA');
    // The client stays the bare event name: the day belongs to the label, not to who it is for.
    expect(seen.initial?.client_name).toBe('CR - NW Regional Office LIUNA');
    expect(seen.initial?.event_date).toBe('2026-09-22');
  });
});
