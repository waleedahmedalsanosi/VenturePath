import { describe, expect, it } from 'vitest';

import { formatDate } from './format';

// Fixed reference date: 2026-05-17 in Asia/Riyadh (UTC+3)
// Using noon UTC so timezone shifts don't flip the calendar date.
const REF_ISO = '2026-05-17T12:00:00Z';
const REF_DATE = new Date(REF_ISO);

describe('formatDate', () => {
  describe('iso format (default)', () => {
    it('returns YYYY-MM-DD from ISO string', () => {
      expect(formatDate(REF_ISO, 'iso', 'Asia/Riyadh')).toBe('2026-05-17');
    });

    it('returns YYYY-MM-DD from Date object', () => {
      expect(formatDate(REF_DATE, 'iso', 'Asia/Riyadh')).toBe('2026-05-17');
    });

    it('uses iso as the default pref', () => {
      expect(formatDate(REF_ISO)).toBe('2026-05-17');
    });
  });

  describe('us format', () => {
    it('returns M/D/YYYY', () => {
      const result = formatDate(REF_ISO, 'us', 'Asia/Riyadh');
      // en-US toLocaleDateString: 5/17/2026
      expect(result).toBe('5/17/2026');
    });
  });

  describe('eu format', () => {
    it('returns D/M/YYYY', () => {
      const result = formatDate(REF_ISO, 'eu', 'Asia/Riyadh');
      // en-GB toLocaleDateString: 17/05/2026
      expect(result).toBe('17/05/2026');
    });
  });

  describe('timezone handling', () => {
    it('respects Asia/Dubai timezone', () => {
      // Same UTC time, Dubai is UTC+4 — same calendar date as Riyadh for noon UTC
      expect(formatDate(REF_ISO, 'iso', 'Asia/Dubai')).toBe('2026-05-17');
    });

    it('shifts calendar date for UTC-offset near midnight', () => {
      // 2026-05-17T23:30:00Z = 2026-05-18 02:30 in Asia/Riyadh (UTC+3)
      const lateUtc = '2026-05-17T23:30:00Z';
      expect(formatDate(lateUtc, 'iso', 'Asia/Riyadh')).toBe('2026-05-18');
      // But still 2026-05-17 in UTC (represented as en-CA in UTC)
      expect(formatDate(lateUtc, 'iso', 'UTC')).toBe('2026-05-17');
    });
  });

  describe('first day of year', () => {
    it('handles Jan 1', () => {
      expect(formatDate('2026-01-01T12:00:00Z', 'iso', 'UTC')).toBe('2026-01-01');
      expect(formatDate('2026-01-01T12:00:00Z', 'us', 'UTC')).toBe('1/1/2026');
      expect(formatDate('2026-01-01T12:00:00Z', 'eu', 'UTC')).toBe('01/01/2026');
    });
  });
});
