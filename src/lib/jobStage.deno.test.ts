import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { nextAction, stageFor, type JobRecord, type JobWithMembers } from './jobStage';

/**
 * `supabase/functions/_shared/jobStage.ts` is a copy of this module, because
 * edge functions cannot import from `src/`. The copy is what `studio-sync`
 * publishes a job's stage with. If the two drift, Studio OS and Soleia's own
 * Jobs screen show different stages for the same job — which is worse than
 * Studio OS showing no stage at all, because both look authoritative.
 *
 * Byte-equality from the first `export`; the headers above that differ on purpose.
 */

const body = (source: string) => source.slice(source.indexOf('export '));

const BROWSER = readFileSync('src/lib/jobStage.ts', 'utf8').replace(/\r\n/g, '\n');
const DENO_COPY = readFileSync('supabase/functions/_shared/jobStage.ts', 'utf8').replace(/\r\n/g, '\n');

describe('jobStage — the Deno copy stays in step', () => {
  it('is byte-identical from the first export', () => {
    expect(body(DENO_COPY)).toBe(body(BROWSER));
  });

  it('actually found an export in both', () => {
    expect(BROWSER.indexOf('export ')).toBeGreaterThan(-1);
    expect(DENO_COPY.indexOf('export ')).toBeGreaterThan(-1);
  });

  it('carries a header saying where it came from', () => {
    expect(DENO_COPY.slice(0, DENO_COPY.indexOf('export '))).toContain('src/lib/jobStage.ts');
  });
});

const job = (over: Partial<JobRecord> = {}): JobRecord => ({
  id: 'job-1', title: 'A job', client_name: 'A client', event_date: '2099-01-01',
  track: 'creative', call_held_on: null, drive_folder_id: 'folder-1',
  drive_folder_url: null, notes: null, is_active: true, ...over,
});

const members = (over: Partial<JobWithMembers> = {}): JobWithMembers => ({
  job: job(), proposals: [], packets: [], sessions: [], assetCount: 0, hasCreativePackage: false, ...over,
});

/**
 * The rules Studio OS will now render. Pinned here because the endpoint has no
 * harness of its own, and because the in-house case is one the owner called out
 * explicitly: an in-house booking owes nobody a proposal and must never be
 * chased for one.
 */
describe('the rules studio-sync publishes', () => {
  it('never asks an in-house booking for a proposal', () => {
    const inHouse = members({ job: job({ track: 'in_house' }) });
    expect(nextAction(inHouse)?.kind).toBe('session');
    expect(['quote', 'sign']).not.toContain(nextAction(inHouse)?.kind);
  });

  it('has nothing to ask of an in-house booking with a session', () => {
    const inHouse = members({
      job: job({ track: 'in_house' }),
      sessions: [{ id: 's', token: null, project_name: 'Session', is_active: true }],
    });
    expect(nextAction(inHouse)).toBeNull();
    expect(stageFor(inHouse).stage).toBe('in_production');
  });

  it('requires BOTH a signature and assets before production', () => {
    const signed = [{
      id: 'p', token: null, event_name: 'E', status: 'accepted', signed_at: '2026-08-01T00:00:00Z',
      is_active: true, signoff_due_on: null, drive_folder_id: 'folder-1',
    }];
    expect(stageFor(members({ proposals: signed, assetCount: 0 })).stage).toBe('awaiting_assets');
    expect(stageFor(members({ proposals: signed, assetCount: 3 })).stage).toBe('in_production');
  });
});
