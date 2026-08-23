import { describe, expect, it } from 'vitest';
import { cleanClientName, cleanClientNameOrNull } from './clientName';

describe('cleanClientName', () => {
  it('drops the trailing comma that split the MOC&CO Drive folder', () => {
    expect(cleanClientName('MOC&CO x ZAXBYS,')).toBe('MOC&CO x ZAXBYS');
  });

  it('trims outer whitespace and collapses runs of space', () => {
    expect(cleanClientName('  NTT   Data  ')).toBe('NTT Data');
  });

  it('leaves punctuation inside the name alone', () => {
    expect(cleanClientName("McDonald's France")).toBe("McDonald's France");
    expect(cleanClientName('MOC&CO x ZAXBYS')).toBe('MOC&CO x ZAXBYS');
    expect(cleanClientName('LiUNA!')).toBe('LiUNA!');
  });

  it('leaves casing alone — CAESARS is how they write it', () => {
    expect(cleanClientName('CAESARS Entertainment')).toBe('CAESARS Entertainment');
  });

  it('strips a trailing separator left by a paste', () => {
    expect(cleanClientName('Interstate15 -')).toBe('Interstate15');
    expect(cleanClientName('Whatnot;')).toBe('Whatnot');
    expect(cleanClientName('Fudale |')).toBe('Fudale');
  });

  it('handles empty input', () => {
    expect(cleanClientName('')).toBe('');
    expect(cleanClientName(null)).toBe('');
    expect(cleanClientName(undefined)).toBe('');
    expect(cleanClientName('   ,  ')).toBe('');
  });

  it('keeps null for columns that allow it', () => {
    expect(cleanClientNameOrNull('  ')).toBeNull();
    expect(cleanClientNameOrNull('AAPL')).toBe('AAPL');
  });
});
