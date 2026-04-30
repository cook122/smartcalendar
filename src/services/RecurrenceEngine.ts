import { RecurrenceRule } from '../types';
import { toISODate, addMonthsKeepDay, findNthWeekday, addDays, addWeeks, getYear, isLeapYear, getMonth, getDate } from '../utils/dateUtils';

interface Occurrence {
  date: string;
  time: string;
  isException: boolean;
}

export function getOccurrences(
  rule: RecurrenceRule,
  startAt: string,
  rangeStart: string,
  rangeEnd: string
): Occurrence[] {
  const result: Occurrence[] = [];
  const startDate = new Date(startAt);
  const startTime = startAt.slice(11, 19); // HH:mm:ss
  const rStart = new Date(rangeStart + 'T00:00:00');
  const rEnd = new Date(rangeEnd + 'T23:59:59');
  const maxIterations = 1000;

  let count = 0;
  let current: Date;

  switch (rule.frequency) {
    case 'daily':
      current = new Date(startAt);
      current.setHours(0, 0, 0, 0);
      while (current <= rEnd && count < maxIterations) {
        if (current >= rStart) {
          const dateStr = toISODate(current);
          if (!isException(rule, dateStr)) {
            result.push({ date: dateStr, time: startTime, isException: false });
            count++;
          } else {
            result.push({ date: dateStr, time: startTime, isException: true });
          }
        }
        if (rule.endType === 'count' && count >= (rule.endCount || 0)) break;
        if (rule.endType === 'until') {
          const until = new Date(rule.endUntil! + 'T00:00:00');
          if (current > until) break;
        }
        current = addDays(current, rule.interval);
      }
      break;

    case 'weekly':
      if (!rule.byDay || rule.byDay.length === 0) {
        rule.byDay = [startDate.getDay()];
      }
      const weekStart = new Date(startDate);
      weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() - startDate.getDay() + 7) % 7));
      let weekCounter = 0;
      while (true) {
        const weekStart = new Date(startDate);
        weekStart.setDate(weekStart.getDate() + weekCounter * rule.interval * 7);
        let weekHadResults = false;
        for (const dayOffset of rule.byDay!) {
          const candidate = addDays(weekStart, ((dayOffset - startDate.getDay()) + 7) % 7);
          if (candidate < startDate) continue;
          if (candidate > rEnd) break;
          if (candidate >= rStart) {
            const dateStr = toISODate(candidate);
            if (!isException(rule, dateStr)) {
              result.push({ date: dateStr, time: startTime, isException: false });
              count++;
            } else {
              result.push({ date: dateStr, time: startTime, isException: true });
            }
            weekHadResults = true;
          }
          if (rule.endType === 'count' && count >= (rule.endCount || 0)) break;
          if (rule.endType === 'until') {
            const until = new Date(rule.endUntil! + 'T00:00:00');
            if (candidate > until) break;
          }
        }
        if (rule.endType === 'count' && count >= (rule.endCount || 0)) break;
        if (rule.endType === 'until') {
          const until = new Date(rule.endUntil! + 'T00:00:00');
          if (addWeeks(weekStart, rule.interval) > until) break;
        }
        if (addWeeks(weekStart, rule.interval) > rEnd) break;
        weekCounter++;
        if (weekCounter > maxIterations) break;
      }
      break;

    case 'monthly':
      current = new Date(startDate);
      while (current <= rEnd && count < maxIterations) {
        if (current >= rStart) {
          const dateStr = toISODate(current);
          if (!isException(rule, dateStr)) {
            result.push({ date: dateStr, time: startTime, isException: false });
            count++;
          } else {
            result.push({ date: dateStr, time: startTime, isException: true });
          }
        }
        if (rule.endType === 'count' && count >= (rule.endCount || 0)) break;
        if (rule.endType === 'until') {
          const until = new Date(rule.endUntil! + 'T00:00:00');
          if (current > until) break;
        }
        if (rule.byMonthDay) {
          current = addMonthsKeepDay(current, rule.interval);
        } else if (rule.bySetPos !== undefined && rule.byDay) {
          const nextMonth = getMonth(current) + rule.interval;
          const nextYear = getYear(current) + Math.floor(nextMonth / 12);
          const adjMonth = ((nextMonth % 12) + 12) % 12 || 12;
          const candidate = findNthWeekday(nextYear, adjMonth, rule.byDay[0], rule.bySetPos);
          if (candidate) {
            current = candidate;
          } else {
            current = addMonthsKeepDay(current, rule.interval);
          }
        } else {
          current = addMonthsKeepDay(current, rule.interval);
        }
      }
      break;

    case 'yearly':
      current = new Date(startDate);
      while (current <= rEnd && count < maxIterations) {
        if (current >= rStart) {
          const dateStr = toISODate(current);
          if (!isException(rule, dateStr)) {
            result.push({ date: dateStr, time: startTime, isException: false });
            count++;
          } else {
            result.push({ date: dateStr, time: startTime, isException: true });
          }
        }
        if (rule.endType === 'count' && count >= (rule.endCount || 0)) break;
        if (rule.endType === 'until') {
          const until = new Date(rule.endUntil! + 'T00:00:00');
          if (current > until) break;
        }
        current = new Date(current);
        current.setFullYear(current.getFullYear() + rule.interval);
        if (rule.byMonthDay && getDate(current) !== rule.byMonthDay) {
          const lastDay = new Date(getYear(current), getMonth(current) + 1, 0);
          if (rule.byMonthDay > getDate(lastDay)) {
            current.setDate(getDate(lastDay));
          } else {
            current.setDate(rule.byMonthDay);
          }
        }
      }
      break;
  }

  return result;
}

function isException(rule: RecurrenceRule, date: string): boolean {
  return rule.exceptions ? rule.exceptions.includes(date) : false;
}

export function getNextOccurrence(
  rule: RecurrenceRule,
  startAt: string,
  afterDate: string
): string | null {
  const after = new Date(afterDate + 'T00:00:00');
  const startDate = new Date(startAt);
  if (after < startDate) {
    return toISODate(startDate);
  }
  const endDate = new Date(afterDate + 'T00:00:00');
  endDate.setDate(endDate.getDate() + 365);
  const occurrences = getOccurrences(rule, startAt, afterDate, toISODate(endDate));
  return occurrences.find(o => !o.isException && o.date > afterDate)?.date || null;
}

export function getRuleDescription(rule: RecurrenceRule): string {
  const parts: string[] = [];
  const freqMap: Record<string, string> = {
    daily: '每天',
    weekly: '每周',
    monthly: '每月',
    yearly: '每年',
  };
  parts.push(freqMap[rule.frequency] || rule.frequency);

  if (rule.interval > 1) {
    parts.push(`每${rule.interval}次`);
  }

  if (rule.byDay && rule.byDay.length > 0) {
    const dayNames = ['日', '一', '二', '三', '四', '五', '六'];
    const days = rule.byDay.map(d => `周${dayNames[d]}`).join('、');
    parts.push(`（${days}）`);
  }

  switch (rule.endType) {
    case 'never':
      parts.push('，永不结束');
      break;
    case 'count':
      parts.push(`，共${rule.endCount}次`);
      break;
    case 'until':
      parts.push(`，至${rule.endUntil}`);
      break;
  }

  return parts.join('');
}
