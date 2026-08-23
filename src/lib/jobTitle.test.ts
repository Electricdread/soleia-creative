import { describe, expect, it } from 'vitest';
import { canonicalJobTitle } from './jobTitle';

describe('canonicalJobTitle', () => {
  it('takes the packet name over the proposal and session names', () => {
    // The real Ascend/MRI job: three records, three names, and the Jobs screen
    // showing a fourth.
    expect(canonicalJobTitle([
      { kind: 'session', name: '10.19.26 MRI Software', updatedAt: '2026-08-01T00:00:00Z' },
      { kind: 'proposal', name: 'MRI', updatedAt: '2026-08-02T00:00:00Z' },
      { kind: 'packet', name: 'CN - MRI Software', updatedAt: '2026-07-01T00:00:00Z' },
    ], 'MRI')).toBe('CN - MRI Software');
  });

  it('falls back to the proposal when there is no packet', () => {
    expect(canonicalJobTitle([
      { kind: 'session', name: '04.08.26 - ROSS Stores' },
      { kind: 'proposal', name: 'ROSS Stores' },
    ], 'Brian Porea')).toBe('ROSS Stores');
  });

  it('falls back to the session when that is all there is', () => {
    expect(canonicalJobTitle([
      { kind: 'session', name: 'Soleia Beach Club' },
    ], 'Soleia')).toBe('Soleia Beach Club');
  });

  it('keeps the current title when nothing is attached', () => {
    expect(canonicalJobTitle([], 'Soleia LV')).toBe('Soleia LV');
  });

  it('ignores blank and whitespace-only names', () => {
    expect(canonicalJobTitle([
      { kind: 'packet', name: '   ' },
      { kind: 'proposal', name: null },
      { kind: 'session', name: 'LiUNA!' },
    ], 'fallback')).toBe('LiUNA!');
  });

  it('prefers the most recently edited record within one kind', () => {
    expect(canonicalJobTitle([
      { kind: 'packet', name: 'Old name', updatedAt: '2026-01-01T00:00:00Z' },
      { kind: 'packet', name: 'Renamed on the card', updatedAt: '2026-08-22T00:00:00Z' },
    ], 'whatever')).toBe('Renamed on the card');
  });

  it('trims the name it returns', () => {
    expect(canonicalJobTitle([{ kind: 'packet', name: '  09.23.26 WHATNOT  ' }], 'Whatnot'))
      .toBe('09.23.26 WHATNOT');
  });

  it('treats a missing timestamp as oldest rather than crashing', () => {
    expect(canonicalJobTitle([
      { kind: 'proposal', name: 'No date', updatedAt: null },
      { kind: 'proposal', name: 'Dated', updatedAt: '2026-05-01T00:00:00Z' },
    ], 'fallback')).toBe('Dated');
  });

  it('carries the client the same way, packet first', () => {
    // Same picker, used for client_name once the owner settled the three
    // spellings that job was carrying.
    expect(canonicalJobTitle([
      { kind: 'session', name: 'MRI', updatedAt: '2026-08-23T00:00:00Z' },
      { kind: 'packet', name: 'MRI', updatedAt: '2026-08-23T00:00:00Z' },
    ], 'Ascend')).toBe('MRI');
  });

  it('keeps the job client when no record names one', () => {
    expect(canonicalJobTitle([
      { kind: 'packet', name: null },
      { kind: 'proposal', name: '' },
    ], '525 Productions')).toBe('525 Productions');
  });
});
