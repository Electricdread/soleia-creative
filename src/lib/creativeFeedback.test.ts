import { describe, expect, it } from 'vitest';
import { summarizeFeedback, type SessionFeedback } from './creativeFeedback';

/** The admin view of client feedback (owner, 2026-09-15). The people and comments are made up. */
const base: SessionFeedback = {
  items: [
    { id: 'i1', title: 'Opener loop', item_type: 'video', thumbnail_url: null, file_url: null },
    { id: 'i2', title: 'Ticker crawl', item_type: 'video', thumbnail_url: null, file_url: null },
    { id: 'i3', title: 'Nobody touched this', item_type: 'image', thumbnail_url: null, file_url: null },
  ],
  reactions: [
    { id: 'r1', item_id: 'i1', reaction_type: 'love', reactor_name: 'Client One', created_at: '2026-09-15T18:00:00Z' },
    { id: 'r2', item_id: 'i2', reaction_type: 'decline', reactor_name: 'Client One', created_at: '2026-09-15T18:01:00Z' },
    { id: 'r3', item_id: 'i1', reaction_type: 'fire', reactor_name: 'Legacy', created_at: '2026-03-01T18:00:00Z' },
  ],
  comments: [
    { id: 'c2', item_id: 'i2', commenter_name: 'Client One', content: 'Too fast', created_at: '2026-09-15T18:05:00Z' },
    { id: 'c1', item_id: 'i2', commenter_name: 'Client Two', content: 'Agreed', created_at: '2026-09-15T18:02:00Z' },
  ],
  signoffs: [],
};

describe('summarizeFeedback', () => {
  it('counts approvals, declines and comments, ignoring retired reaction types', () => {
    const s = summarizeFeedback(base);
    expect([s.approved, s.declined, s.comments, s.signoffs, s.total]).toEqual([1, 1, 2, 0, 4]);
  });

  it('lists only items someone responded to, in mood board order, comments oldest first', () => {
    const s = summarizeFeedback(base);
    expect(s.items.map((entry) => entry.item.id)).toEqual(['i1', 'i2']);
    expect(s.items[1].comments.map((c) => c.id)).toEqual(['c1', 'c2']);
    expect(s.items[1].declinedBy[0].reactor_name).toBe('Client One');
  });

  it('knows the latest activity, sign-offs included, and puts the newest sign-off first', () => {
    const s = summarizeFeedback({
      ...base,
      signoffs: [
        { id: 'o1', signer_name: 'Client One', approved_item_ids: ['i1'], created_at: '2026-09-15T18:10:00Z' },
        { id: 'o2', signer_name: 'Client One', approved_item_ids: ['i1'], created_at: '2026-09-15T18:20:00Z' },
      ],
    });
    expect(s.latestAt).toBe('2026-09-15T18:20:00Z');
    expect(s.signoffList.map((o) => o.id)).toEqual(['o2', 'o1']);
  });

  it('reports nothing for a session no client has touched', () => {
    const s = summarizeFeedback({ items: base.items, reactions: [], comments: [], signoffs: [] });
    expect(s.total).toBe(0);
    expect(s.latestAt).toBeNull();
    expect(s.items).toEqual([]);
  });
});
