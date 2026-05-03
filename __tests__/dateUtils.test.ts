import {
  toISODate,
  toISOTime,
  toISODateTime,
  getMonthEndDate,
  addMonthsKeepDay,
  findNthWeekday,
  isLeapYearDate,
} from '@/utils/dateUtils';

describe('toISODate', () => {
  it('formats Date to yyyy-MM-dd', () => {
    expect(toISODate(new Date(2025, 0, 15))).toBe('2025-01-15');
  });
  it('parses ISO string and formats', () => {
    expect(toISODate('2025-03-08T12:30:00')).toBe('2025-03-08');
  });
});

describe('toISOTime', () => {
  it('formats Date to HH:mm', () => {
    expect(toISOTime(new Date(2025, 0, 1, 9, 5))).toBe('09:05');
  });
});

describe('toISODateTime', () => {
  it('formats Date to ISO datetime string', () => {
    const d = new Date(2025, 5, 1, 14, 30, 0);
    expect(toISODateTime(d)).toBe('2025-06-01T14:30:00');
  });
  it('parses string and re-formats', () => {
    expect(toISODateTime('2025-01-01T00:00:00')).toBe('2025-01-01T00:00:00');
  });
});

describe('getMonthEndDate', () => {
  it('returns last day of Jan', () => {
    expect(getMonthEndDate(2025, 1)).toBe('2025-01-31');
  });
  it('returns last day of Feb (non-leap)', () => {
    expect(getMonthEndDate(2025, 2)).toBe('2025-02-28');
  });
  it('returns last day of Feb (leap)', () => {
    expect(getMonthEndDate(2024, 2)).toBe('2024-02-29');
  });
});

describe('addMonthsKeepDay', () => {
  it('adds months preserving day', () => {
    const result = addMonthsKeepDay(new Date(2025, 0, 15), 1);
    expect(result.getMonth()).toBe(1);
    expect(result.getDate()).toBe(15);
  });
  it('handles month overflow (Jan 31 -> Feb 28)', () => {
    const result = addMonthsKeepDay(new Date(2025, 0, 31), 1);
    expect(result.getMonth()).toBe(1);
    expect(result.getDate()).toBe(28);
  });
});

describe('findNthWeekday', () => {
  it('finds 2nd Tuesday of March 2025', () => {
    const result = findNthWeekday(2025, 3, 2, 2);
    expect(result).not.toBeNull();
    expect(result!.getDate()).toBe(11);
    expect(result!.getMonth()).toBe(2);
  });
  it('finds last Friday of March 2025', () => {
    const result = findNthWeekday(2025, 3, 5, -1);
    expect(result).not.toBeNull();
    expect(result!.getDate()).toBe(28);
  });
  it('returns null for 5th Monday if not in month', () => {
    const result = findNthWeekday(2025, 2, 1, 5);
    expect(result).toBeNull();
  });
});

describe('isLeapYearDate', () => {
  it('identifies leap year', () => {
    expect(isLeapYearDate(new Date(2024, 0, 1))).toBe(true);
  });
  it('identifies non-leap year', () => {
    expect(isLeapYearDate(new Date(2025, 0, 1))).toBe(false);
  });
});
