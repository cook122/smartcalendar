import { getOccurrences, getNextOccurrence, getRuleDescription } from '@/services/RecurrenceEngine';
import { RecurrenceRule } from '@/types';

describe('RecurrenceEngine - daily', () => {
  const rule: RecurrenceRule = {
    frequency: 'daily',
    interval: 1,
    endType: 'never',
  };

  it('generates daily occurrences within range', () => {
    const result = getOccurrences(rule, '2025-03-01T09:00:00', '2025-03-01', '2025-03-05');
    const dates = result.filter(o => !o.isException).map(o => o.date);
    expect(dates).toEqual([
      '2025-03-01', '2025-03-02', '2025-03-03', '2025-03-04', '2025-03-05',
    ]);
  });

  it('respects interval=2 (every other day)', () => {
    const r: RecurrenceRule = { ...rule, interval: 2 };
    const result = getOccurrences(r, '2025-03-01T09:00:00', '2025-03-01', '2025-03-07');
    const dates = result.filter(o => !o.isException).map(o => o.date);
    expect(dates).toEqual(['2025-03-01', '2025-03-03', '2025-03-05', '2025-03-07']);
  });

  it('respects endCount', () => {
    const r: RecurrenceRule = { ...rule, endType: 'count', endCount: 3 };
    const result = getOccurrences(r, '2025-03-01T09:00:00', '2025-03-01', '2025-03-10');
    const dates = result.filter(o => !o.isException).map(o => o.date);
    expect(dates).toEqual(['2025-03-01', '2025-03-02', '2025-03-03']);
  });

  it('respects endUntil', () => {
    const r: RecurrenceRule = { ...rule, endType: 'until', endUntil: '2025-03-03' };
    const result = getOccurrences(r, '2025-03-01T09:00:00', '2025-03-01', '2025-03-10');
    const dates = result.filter(o => !o.isException).map(o => o.date);
    expect(dates).toEqual(['2025-03-01', '2025-03-02', '2025-03-03']);
  });

  it('handles exceptions', () => {
    const r: RecurrenceRule = { ...rule, exceptions: ['2025-03-02'] };
    const result = getOccurrences(r, '2025-03-01T09:00:00', '2025-03-01', '2025-03-04');
    const normal = result.filter(o => !o.isException).map(o => o.date);
    const exc = result.filter(o => o.isException).map(o => o.date);
    expect(normal).toEqual(['2025-03-01', '2025-03-03', '2025-03-04']);
    expect(exc).toEqual(['2025-03-02']);
  });
});

describe('RecurrenceEngine - weekly', () => {
  it('generates weekly occurrences by day', () => {
    const rule: RecurrenceRule = {
      frequency: 'weekly',
      interval: 1,
      byDay: [1, 3], // Mon, Wed
      endType: 'count',
      endCount: 5,
    };
    const result = getOccurrences(rule, '2025-03-03T10:00:00', '2025-03-03', '2025-03-31');
    const dates = result.filter(o => !o.isException).map(o => o.date);
    expect(dates.length).toBe(5);
    // First occurrence should be Monday
    expect(new Date(dates[0] + 'T00:00:00').getDay()).toBe(1);
  });

  it('uses start day if byDay not specified', () => {
    const rule: RecurrenceRule = {
      frequency: 'weekly',
      interval: 1,
      endType: 'count',
      endCount: 3,
    };
    // 2025-03-04 is a Tuesday (2)
    const result = getOccurrences(rule, '2025-03-04T10:00:00', '2025-03-04', '2025-03-25');
    const dates = result.filter(o => !o.isException).map(o => o.date);
    expect(dates.length).toBe(3);
    dates.forEach(d => {
      expect(new Date(d + 'T00:00:00').getDay()).toBe(2);
    });
  });
});

describe('RecurrenceEngine - monthly', () => {
  it('generates monthly by month day', () => {
    const rule: RecurrenceRule = {
      frequency: 'monthly',
      interval: 1,
      byMonthDay: 15,
      endType: 'count',
      endCount: 3,
    };
    const result = getOccurrences(rule, '2025-01-15T10:00:00', '2025-01-01', '2025-06-30');
    const dates = result.filter(o => !o.isException).map(o => o.date);
    expect(dates).toEqual(['2025-01-15', '2025-02-15', '2025-03-15']);
  });

  it('generates monthly by nth weekday', () => {
    const rule: RecurrenceRule = {
      frequency: 'monthly',
      interval: 1,
      byDay: [1], // Monday
      bySetPos: 2, // 2nd Monday
      endType: 'count',
      endCount: 3,
    };
    const result = getOccurrences(rule, '2025-01-13T10:00:00', '2025-01-01', '2025-06-30');
    const dates = result.filter(o => !o.isException).map(o => o.date);
    expect(dates.length).toBe(3);
    // 2nd Monday of Jan 2025 = Jan 13
    expect(dates[0]).toBe('2025-01-13');
  });
});

describe('RecurrenceEngine - yearly', () => {
  it('generates yearly occurrences', () => {
    const rule: RecurrenceRule = {
      frequency: 'yearly',
      interval: 1,
      endType: 'count',
      endCount: 3,
    };
    const result = getOccurrences(rule, '2023-06-15T10:00:00', '2023-01-01', '2026-12-31');
    const dates = result.filter(o => !o.isException).map(o => o.date);
    expect(dates).toEqual(['2023-06-15', '2024-06-15', '2025-06-15']);
  });
});

describe('getNextOccurrence', () => {
  it('returns next daily occurrence', () => {
    const rule: RecurrenceRule = { frequency: 'daily', interval: 1, endType: 'never' };
    const next = getNextOccurrence(rule, '2025-03-01T09:00:00', '2025-03-01');
    expect(next).toBe('2025-03-02');
  });

  it('returns start date if after is before start', () => {
    const rule: RecurrenceRule = { frequency: 'daily', interval: 1, endType: 'never' };
    const next = getNextOccurrence(rule, '2025-03-05T09:00:00', '2025-03-01');
    expect(next).toBe('2025-03-05');
  });

  it('skips exceptions', () => {
    const rule: RecurrenceRule = {
      frequency: 'daily',
      interval: 1,
      endType: 'never',
      exceptions: ['2025-03-02'],
    };
    const next = getNextOccurrence(rule, '2025-03-01T09:00:00', '2025-03-01');
    expect(next).toBe('2025-03-03');
  });
});

describe('getRuleDescription', () => {
  it('describes daily rule', () => {
    const rule: RecurrenceRule = { frequency: 'daily', interval: 1, endType: 'never' };
    expect(getRuleDescription(rule)).toContain('每天');
  });

  it('describes weekly with byDay', () => {
    const rule: RecurrenceRule = {
      frequency: 'weekly',
      interval: 1,
      byDay: [1, 3],
      endType: 'count',
      endCount: 10,
    };
    const desc = getRuleDescription(rule);
    expect(desc).toContain('每周');
    expect(desc).toContain('周一');
    expect(desc).toContain('10次');
  });

  it('describes monthly with until end', () => {
    const rule: RecurrenceRule = {
      frequency: 'monthly',
      interval: 2,
      endType: 'until',
      endUntil: '2025-12-31',
    };
    const desc = getRuleDescription(rule);
    expect(desc).toContain('每月');
    expect(desc).toContain('2次');
    expect(desc).toContain('2025-12-31');
  });
});
