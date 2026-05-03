import { format, parseISO, addMonths, getDate, setDate, getMonth, getYear, isLeapYear, lastDayOfMonth, getDay, addWeeks, addDays } from 'date-fns';

export { format, parseISO, addMonths, getDate, getMonth, getYear, isLeapYear, lastDayOfMonth, getDay, addWeeks, addDays };

export function toISODate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'yyyy-MM-dd');
}

export function toISOTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'HH:mm');
}

export function toISODateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, "yyyy-MM-dd'T'HH:mm:ss");
}

export function getMonthEndDate(year: number, month: number): string {
  const d = lastDayOfMonth(new Date(year, month - 1, 1));
  return toISODate(d);
}

export function addMonthsKeepDay(date: Date, months: number): Date {
  const originalDay = getDate(date);
  const newDate = addMonths(date, months);
  if (getDate(newDate) !== originalDay) {
    const lastDay = getDate(lastDayOfMonth(newDate));
    newDate.setDate(Math.min(originalDay, lastDay));
  }
  return newDate;
}

export function findNthWeekday(year: number, month: number, weekday: number, pos: number): Date | null {
  if (pos > 0) {
    const firstDay = new Date(year, month - 1, 1);
    const daysUntilFirst = (weekday - getDay(firstDay) + 7) % 7;
    const firstMatch = new Date(year, month - 1, 1 + daysUntilFirst + (pos - 1) * 7);
    return getMonth(firstMatch) === month - 1 ? firstMatch : null;
  } else {
    const lastDay = lastDayOfMonth(new Date(year, month - 1, 1));
    const daysUntilLast = (getDay(lastDay) - weekday + 7) % 7;
    const lastMatch = new Date(year, month - 1, getDate(lastDay) - daysUntilLast + (pos + 1) * 7);
    return getMonth(lastMatch) === month - 1 ? lastMatch : null;
  }
}

export function isLeapYearDate(date: Date): boolean {
  return isLeapYear(date);
}
