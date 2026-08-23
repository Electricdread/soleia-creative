import { describe, expect, it } from 'vitest';
import { extractMeetingUrl, labelForUrl, parseInvite, wallTimeInZone } from './meetingInvite';

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
    expect(parsed.timeZone).toBe('America/Los_Angeles');
    expect(parsed.startsAt?.getTime())
      .toBe(wallTimeInZone(2026, 9, 5, 17, 0, 'America/Los_Angeles').getTime());
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

  it('reads an Eastern invite as Eastern, not as local time', () => {
    // The three-hour error this exists to stop: 5pm Eastern is 2pm here.
    const parsed = parseInvite('Oct 5, 2026 5:00 PM Eastern Time (US and Canada) https://us02web.zoom.us/j/42');
    expect(parsed.timeZone).toBe('America/New_York');
    expect(parsed.timeZoneLabel).toBe('Eastern');
    expect(parsed.startsAt?.getTime())
      .toBe(wallTimeInZone(2026, 9, 5, 17, 0, 'America/New_York').getTime());
  });

  it('measures a range in the zone the invite states', () => {
    const parsed = parseInvite('Oct 5, 2026 5:00 PM - 6:30 PM ET https://meet.google.com/abc-defg-hij');
    expect(parsed.durationMinutes).toBe(90);
  });

  it('does not mistake lowercase prose for a timezone', () => {
    const parsed = parseInvite('Oct 5, 2026 5:00 PM — we can ct the agenda short https://us02web.zoom.us/j/42');
    expect(parsed.timeZone).toBeNull();
    expect(local(parsed.startsAt)).toBe('2026-10-05 17:00');
  });

  it('reads a day-first date the way Google Calendar writes it', () => {
    const parsed = parseInvite('Creative call ⋅ Monday, 5 October 2026 ⋅ 17:00 https://meet.google.com/abc-defg-hij');
    expect(local(parsed.startsAt)).toBe('2026-10-05 17:00');
  });

  it('names an unlabelled meeting after where it is held', () => {
    expect(labelForUrl('https://us02web.zoom.us/j/42')).toBe('Zoom meeting');
    expect(labelForUrl('https://teams.microsoft.com/l/meetup-join/x')).toBe('Teams meeting');
    expect(labelForUrl('https://meet.google.com/abc-defg-hij')).toBe('Google Meet');
    expect(labelForUrl('https://example.com/room/7')).toBe('Meeting');
  });
  it('survives the round trip the form makes when it saves', () => {
    // The form shows the parsed instant as local date and time strings, then
    // rebuilds a Date from those two strings on save. What is stored has to be
    // the instant that was parsed, or a meeting drifts by hours between being
    // read and being written.
    const paste = `Microsoft Teams meeting
Oct 5, 2026 5:00 PM Eastern Time, 45 minutes
https://teams.microsoft.com/l/meetup-join/19%3ameeting_abc/0`;
    const parsed = parseInvite(paste);
    expect(parsed.startsAt).not.toBeNull();

    const dateField = `${parsed.startsAt!.getFullYear()}-${String(parsed.startsAt!.getMonth() + 1).padStart(2, '0')}-${String(parsed.startsAt!.getDate()).padStart(2, '0')}`;
    const timeField = `${String(parsed.startsAt!.getHours()).padStart(2, '0')}:${String(parsed.startsAt!.getMinutes()).padStart(2, '0')}`;
    const saved = new Date(`${dateField}T${timeField}`);

    expect(saved.getTime()).toBe(parsed.startsAt!.getTime());
    expect(parsed.durationMinutes).toBe(45);
  });
});
