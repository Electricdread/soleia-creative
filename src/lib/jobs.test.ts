import { describe, it, expect } from 'vitest';
import { deriveJobs } from './jobs';
import snapshot from './__fixtures__/jobsSnapshot.json';

const jobs = deriveJobs({
  proposals: snapshot.proposals as never,
  packets: snapshot.packets as never,
  sessions: snapshot.sessions as never,
  assetsByProposal: snapshot.assetsByProposal,
  creativePackageProposalIds: new Set(snapshot.creativePackageProposalIds),
});

const byMember = (id: string) => jobs.find((j) => j.members.some((m) => m.id === id))!;

describe('job derivation over the live records', () => {
  it('groups a job filed under three different names', () => {
    const mri = byMember('P-ascend');
    expect(mri.members.map((m) => m.id).sort()).toEqual(['K-ascend', 'P-ascend', 'S-mri']);
    expect(mri.aliases).toContain('Ascend');
    expect(mri.aliases).toContain('MRI');
  });

  it('groups across a trailing comma and a date prefix', () => {
    const zax = byMember('P-moc');
    expect(zax.members.map((m) => m.id).sort()).toEqual(['K-moc', 'P-moc', 'S-zaxbys']);
  });

  it('groups on a leading zero and a case difference', () => {
    expect(byMember('P-whatnot').members.map((m) => m.id).sort()).toEqual(['K-whatnot', 'P-whatnot']);
  });

  it('puts a session-only booking on the in-house track', () => {
    const liuna = byMember('S-liuna');
    expect(liuna.track).toBe('in_house');
    expect(liuna.members).toHaveLength(1);
  });

  it('does not merge unrelated jobs that share a generic word', () => {
    expect(byMember('K-soleia').key).not.toBe(byMember('S-beach').key);
    expect(byMember('S-beach').key).not.toBe(byMember('S-sample').key);
  });

  it('derives the stage from what actually exists', () => {
    expect(byMember('P-whatnot').stage).toBe('in_production');
    expect(byMember('P-i15').stage).toBe('proposal_out');
    expect(byMember('K-wwt').stage).toBe('packet_sent');
  });

  it('flags a Creative Package with no session, and a job with no date', () => {
    const mri = byMember('P-ascend');
    expect(mri.hasCreativePackage).toBe(true);
    expect(mri.flags.join(' ')).toContain('No event date');
  });

  it('flags one job holding two different Drive folders', () => {
    expect(byMember('P-whatnot').flags.join(' ')).toContain('Drive folders');
    expect(byMember('P-moc').flags.join(' ')).toContain('Drive folders');
  });
});
