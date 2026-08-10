import {
  toDateKey,
  toIsoDateString,
  toLocaleDateOrRaw,
  combineDateAndTime,
  parseFlexibleDate,
} from './date.util';

describe('date.util', () => {
  describe('toDateKey', () => {
    it('builds a local YYYY-MM-DD key without UTC shift', () => {
      expect(toDateKey(new Date(2026, 0, 5))).toBe('2026-01-05');
    });

    it('accepts a string input', () => {
      expect(toDateKey('2026-12-31T10:00:00')).toBe('2026-12-31');
    });
  });

  describe('toIsoDateString', () => {
    it('returns the ISO date part', () => {
      expect(toIsoDateString('2026-03-04T00:00:00Z')).toBe('2026-03-04');
    });

    it('returns empty string for empty input', () => {
      expect(toIsoDateString('')).toBe('');
      expect(toIsoDateString(null)).toBe('');
      expect(toIsoDateString(undefined)).toBe('');
    });
  });

  describe('toLocaleDateOrRaw', () => {
    it('returns the fallback for empty input', () => {
      expect(toLocaleDateOrRaw('', 'n/a')).toBe('n/a');
    });

    it('returns the raw value when unparseable', () => {
      expect(toLocaleDateOrRaw('not-a-date')).toBe('not-a-date');
    });
  });

  describe('combineDateAndTime', () => {
    it('combines a date with an HH:mm time', () => {
      const combined = combineDateAndTime(new Date(2026, 5, 1), '14:30');
      expect(combined).not.toBeNull();
      expect(combined!.getHours()).toBe(14);
      expect(combined!.getMinutes()).toBe(30);
      expect(combined!.getFullYear()).toBe(2026);
      expect(combined!.getMonth()).toBe(5);
      expect(combined!.getDate()).toBe(1);
    });

    it('returns null when the date is missing', () => {
      expect(combineDateAndTime(null, '10:00')).toBeNull();
    });

    it('returns null when the time is missing', () => {
      expect(combineDateAndTime(new Date(), '')).toBeNull();
      expect(combineDateAndTime(new Date(), null)).toBeNull();
    });

    it('does not mutate the source date', () => {
      const source = new Date(2026, 0, 1, 0, 0);
      combineDateAndTime(source, '23:59');
      expect(source.getHours()).toBe(0);
      expect(source.getMinutes()).toBe(0);
    });
  });

  describe('parseFlexibleDate', () => {
    it('parses a DDMMYYYY digit string', () => {
      const date = parseFlexibleDate('15062026');
      expect(date).not.toBeNull();
      expect(date!.getDate()).toBe(15);
      expect(date!.getMonth()).toBe(5);
      expect(date!.getFullYear()).toBe(2026);
    });

    it('ignores non-digit separators', () => {
      const date = parseFlexibleDate('15/06/2026');
      expect(date).not.toBeNull();
      expect(date!.getDate()).toBe(15);
    });

    it('returns null when there are not exactly 8 digits', () => {
      expect(parseFlexibleDate('1506202')).toBeNull();
      expect(parseFlexibleDate('')).toBeNull();
    });

    it('returns null for a calendar-impossible date', () => {
      expect(parseFlexibleDate('31022026')).toBeNull();
    });
  });
});
