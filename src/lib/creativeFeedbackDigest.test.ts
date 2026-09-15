import { describe, expect, it } from 'vitest';
import {
  buildFeedbackDigest,
  escapeHtml,
  reactionKind,
  type FeedbackEvent,
  type FeedbackSession,
} from '../../supabase/functions/_shared/creativeFeedbackDigest';

/**
 * The client-feedback email (owner, 2026-09-15: "when approving or declining, commenting is not registering").
 * The session names are the live ones; the people and comments are made up.
 */
const sessions: FeedbackSession[] = [
  { id: 's-liuna', projectName: '09.22.26 LiUNA!', clientName: 'LiUNA!', token: 'tok-liuna', eventDate: '2026-09-22' },
  { id: 's-whatnot', projectName: '09.23.26 WHATNOT', clientName: 'WhatNot', token: 'tok-whatnot', eventDate: '2026-09-23' },
];

const event = (over: Partial<FeedbackEvent>): FeedbackEvent => ({
  kind: 'approved', at: '2026-09-15T18:00:00Z', who: 'Client One', sessionId: 's-liuna', itemTitle: 'Opener loop', ...over,
});

describe('reactionKind', () => {
  it('reports the two choices the session page offers and nothing else', () => {
    expect(reactionKind('love')).toBe('approved');
    expect(reactionKind('decline')).toBe('declined');
    expect(reactionKind('fire')).toBeNull();
    expect(reactionKind('star')).toBeNull();
  });
});

describe('buildFeedbackDigest', () => {
  it('sends nothing when nothing is new', () => {
    expect(buildFeedbackDigest([], sessions, 'https://soleiacreative.app')).toBeNull();
  });

  it('names the session and counts each kind in the subject', () => {
    const digest = buildFeedbackDigest([
      event({}),
      event({ kind: 'declined', itemTitle: 'Ticker crawl', at: '2026-09-15T18:01:00Z' }),
      event({ kind: 'comment', text: 'Can the gold be warmer?', at: '2026-09-15T18:02:00Z' }),
      event({ kind: 'signoff', itemCount: 3, at: '2026-09-15T18:03:00Z' }),
    ], sessions, 'https://soleiacreative.app')!;
    expect(digest.subject).toBe('Soleia · 09.22.26 LiUNA! · 1 approved, 1 declined, 1 comment, 1 confirmed');
    expect(digest.counts).toEqual({ approved: 1, declined: 1, comment: 1, signoff: 1 });
    expect(digest.html).toContain('https://soleiacreative.app/creative/tok-liuna');
    expect(digest.html).toContain('confirmed their approval of 3 items');
    expect(digest.html).toContain('Can the gold be warmer?');
  });

  it('puts the session with the latest activity first when several have news', () => {
    const digest = buildFeedbackDigest([
      event({ sessionId: 's-liuna', at: '2026-09-15T18:00:00Z' }),
      event({ sessionId: 's-whatnot', at: '2026-09-15T18:10:00Z' }),
    ], sessions, 'https://soleiacreative.app')!;
    expect(digest.subject).toBe('Soleia · client feedback on 2 sessions · 2 approved');
    expect(digest.html.indexOf('09.23.26 WHATNOT')).toBeLessThan(digest.html.indexOf('09.22.26 LiUNA!'));
  });

  it('escapes what clients typed, so a comment cannot write into the email', () => {
    const digest = buildFeedbackDigest([
      event({ kind: 'comment', who: '<b>Mallory</b>', text: '<script>alert(1)</script> & "quotes"' }),
    ], sessions, 'https://soleiacreative.app')!;
    expect(digest.html).not.toContain('<script>');
    expect(digest.html).toContain('&lt;script&gt;alert(1)&lt;/script&gt; &amp; &quot;quotes&quot;');
    expect(digest.html).toContain('&lt;b&gt;Mallory&lt;/b&gt;');
    expect(escapeHtml(`it's`)).toBe('it&#39;s');
  });

  it('leaves out activity on a session it was not given', () => {
    expect(buildFeedbackDigest([event({ sessionId: 'deleted-session' })], sessions, 'https://soleiacreative.app')).toBeNull();
  });
});
