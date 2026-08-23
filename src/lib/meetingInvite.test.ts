import { describe, expect, it } from 'vitest';
import { extractMeetingUrl, parseInvite } from './meetingInvite';

const local = (d: Date | null) =>
  d
    ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
    : null;

describe('meetingInvite', () => {
  it('reads a Zoom invite', () => {
    const paste = `Luis Dreamz is inviting you to a scheduled Zoom meeting.

Topic: NCAN Creative Call
Time: Oct 5, 2026 05:00 PM Pacific Time (US and Canada)

Join Zoom Meeting
https://us02web.zoom.us/j/86541237890?pwd=Zm9vYmFyYmF6

Meeting ID: 865 4123 7890`;
    const parsed = parseInvite(paste);
    expect(parsed.url).toBe('https://us02web.zoom.us/j/86541237890?pwd=Zm9vYmFyYmF6');
    expect(local(parsed.startsAt)).toBe('2026-10-05 17:00');
  });

  it('reads a Google Meet line with a time range and gets the duration', () => {
    const parsed = parseInvite('Creative call — Monday, October 5, 2026 5:00 PM - 6:30 PM https://meet.google.com/abc-defg-hij');
    expect(parsed.url).toBe('https://meet.google.com/abc-defg-hij');
    expect(local(parsed.startsAt)).toBe('2026-10-05 17:00');
    expect(parsed.durationMinutes).toBe(90);
  });

  it('reads a Teams invite with a stated length', () => {
    const paste = `Microsoft Teams meeting
10/5/2026 5:00 PM, 45 minutes
Join on your computer: https://teams.microsoft.com/l/meetup-join/19%3ameeting_abc/0`;
    const parsed = parseInvite(paste);
    expect(parsed.url).toContain('teams.microsoft.com/l/meetup-join');
    expect(local(parsed.startsAt)).toBe('2026-10-05 17:00');
    expect(parsed.durationMinutes).toBe(45);
  });

  it('handles an ISO date and 24-hour time', () => {
    const parsed = parseInvite('2026-10-05 17:00 https://whereby.com/soleia');
    expect(local(parsed.startsAt)).toBe('2026-10-05 17:00');
  });

  it('prefers the meeting link over other links in the paste', () => {
    const paste = 'Agenda: https://docs.google.com/document/d/abc\nJoin: https://us02web.zoom.us/j/999';
    expect(extractMeetingUrl(paste)).toBe('https://us02web.zoom.us/j/999');
  });

  it('trims punctuation an email client leaves on a URL', () => {
    expect(extractMeetingUrl('Join here (https://meet.google.com/abc-defg-hij).')).toBe('https://meet.google.com/abc-defg-hij');
  });

  it('returns a bare URL with no time when the paste is only a link', () => {
    const parsed = parseInvite('https://us02web.zoom.us/j/12345');
    expect(parsed.url).toBe('https://us02web.zoom.us/j/12345');
    expect(parsed.startsAt).toBeNull();
  });

  it('does not invent a duration from two unrelated times', () => {
    const parsed = parseInvite('Oct 5, 2026 5:00 PM call. Event doors at 8:00 PM.');
    expect(local(parsed.startsAt)).toBe('2026-10-05 17:00');
    expect(parsed.durationMinutes).toBeNull();
  });
});
