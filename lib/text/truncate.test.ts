import { describe, expect, it } from 'vitest';
import { truncateWords } from './truncate';

describe('truncateWords', () => {
  it('returns short strings unchanged', () => {
    expect(truncateWords('Hello world', 20)).toBe('Hello world');
  });

  it('returns string unchanged when exactly at maxChars', () => {
    const s = 'exactly ten.';
    expect(truncateWords(s, s.length)).toBe(s);
  });

  it('truncates at word boundary when a space exists in the window', () => {
    // 'Hello beautiful world' is 21 chars; with maxChars=15 the window is 14 chars
    // 'Hello beautiful' slice(0,14) = 'Hello beautifu'; lastSpace=5 (> floor(15*0.5)=7? 5 < 7 — falls through)
    // Let's use a simpler case: maxChars=12, input='Hello big world'
    // window = slice(0,11) = 'Hello big w'; lastSpace=9; floor(12*0.5)=6; 9>6 → 'Hello big' + '…'
    expect(truncateWords('Hello big world', 12)).toBe('Hello big…');
  });

  it('falls back to hard-cut when no word boundary exists in the window', () => {
    // 'superlongwordwithoutspaces', maxChars=10
    // window=slice(0,9)='superlong'; lastSpace=-1; -1 < floor(10*0.5)=5 → hard cut
    expect(truncateWords('superlongwordwithoutspaces', 10)).toBe('superlong…');
  });

  it('returns empty string for null', () => {
    expect(truncateWords(null, 10)).toBe('');
  });

  it('returns empty string for undefined', () => {
    expect(truncateWords(undefined, 10)).toBe('');
  });

  it('returns empty string for empty string', () => {
    expect(truncateWords('', 10)).toBe('');
  });

  it('trims leading/trailing whitespace before measuring', () => {
    expect(truncateWords('  hi  ', 20)).toBe('hi');
  });

  it('uses ellipsis character (…) not three dots', () => {
    const result = truncateWords('superlongwordwithoutspaces', 10);
    expect(result.endsWith('…')).toBe(true);
    expect(result.endsWith('...')).toBe(false);
  });
});
