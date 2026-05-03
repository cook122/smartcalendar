import { RecurrenceRule } from '../types';
import { toISODate, addMonthsKeepDay, findNthWeekday, addDays, addWeeks, getYear, getMonth, getDate } from '../utils/dateUtils';

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
  const startTime = startAt.slice(11, 19);
  const rStart = new Date(rangeStart + 'T00:00:00');
  const rEnd = new Date(rangeEnd + 'T23:59:59');
  const maxIterations = 1000;

  // work on a copy to avoid mutating input
  const localRule: RecurrenceRule = { ...rule, byDay: rule.byDay ? [...rule.byDay] : undefined };

  let count = 0;
  let current: Date;

  switch (localRule.frequency) {
    case 'daily':
      current = new Date(startAt);
      current.setHours(0, 0, 0, 0);
      while (current <= rEnd && count < maxIterations) {
        if (localRule.endType === 'count' && count >= (localRule.endCount || 0)) break;
        if (localRule.endType === 'until') {
          const until = new Date(localRule.endUntil! + 'T00:00:00');
          if (current > until) break;
        }
        if (current >= rStart) {
          addResult(result, localRule, current, startTime, count);
          if (!isException(localRule, toISODate(current))) count++;
        }
        current = addDays(current, localRule.interval);
      }
      break;

    case 'weekly':
      if (!localRule.byDay || localRule.byDay.length === 0) {
        localRule.byDay = [startDate.getDay()];
      }
      let weekCounter = 0;
      while (true) {
        const weekBase = new Date(startDate);
        weekBase.setDate(weekBase.getDate() + weekCounter * localRule.interval * 7);
        for (const dayOffset of localRule.byDay!) {
          const candidate = addDays(weekBase, ((dayOffset - startDate.getDay()) + 7) % 7);
          if (candidate < startDate) continue;
          if (candidate > rEnd) break;
          if (candidate >= rStart) {
            addResult(result, localRule, candidate, startTime, count);
            if (!isException(localRule, toISODate(candidate))) count++;
          }
          if (localRule.endType === 'count' && count >= (localRule.endCount || 0)) break;
          if (localRule.endType === 'until') {
            const until = new Date(localRule.endUntil! + 'T00:00:00');
            if (candidate > until) break;
          }
        }
        if (localRule.endType === 'count' && count >= (localRule.endCount || 0)) break;
        if (localRule.endType === 'until') {
          const until = new Date(localRule.endUntil! + 'T00:00:00');
          if (addWeeks(weekBase, localRule.interval) > until) break;
        }
        if (addWeeks(weekBase, localRule.interval) > rEnd) break;
        weekCounter++;
        if (weekCounter > maxIterations) break;
      }
      break;

    case 'monthly':
      current = new Date(startDate);
      while (current <= rEnd && count < maxIterations) {
        if (current >= rStart) {
          addResult(result, localRule, current, startTime, count);
          if (!isException(localRule, toISODate(current))) count++;
        }
        if (localRule.endType === 'count' && count >= (localRule.endCount || 0)) break;
        if (localRule.endType === 'until') {
          const until = new Date(localRule.endUntil! + 'T00:00:00');
          if (current > until) break;
        }
        if (localRule.byMonthDay) {
          current = addMonthsKeepDay(current, localRule.interval);
        } else if (localRule.bySetPos !== undefined && localRule.byDay) {
          const nextMonth = getMonth(current) + localRule.interval;
          const nextYear = getYear(current) + Math.floor(nextMonth / 12);
          const adjMonth = ((nextMonth % 12) + 12) % 12 || 12;
          const candidate = findNthWeekday(nextYear, adjMonth, localRule.byDay[0], localRule.bySetPos);
          if (candidate) {
            current = candidate;
          } else {
            current = addMonthsKeepDay(current, localRule.interval);
          }
        } else {
          current = addMonthsKeepDay(current, localRule.interval);
        }
      }
      break;

    case 'yearly':
      current = new Date(startDate);
      while (current <= rEnd && count < maxIterations) {
        if (current >= rStart) {
          addResult(result, localRule, current, startTime, count);
          if (!isException(localRule, toISODate(current))) count++;
        }
        if (localRule.endType === 'count' && count >= (localRule.endCount || 0)) break;
        if (localRule.endType === 'until') {
          const until = new Date(localRule.endUntil! + 'T00:00:00');
          if (current > until) break;
        }
        current = new Date(current);
        current.setFullYear(current.getFullYear() + localRule.interval);
        if (localRule.byMonthDay && getDate(current) !== localRule.byMonthDay) {
          const lastDay = new Date(getYear(current), getMonth(current) + 1, 0);
          if (localRule.byMonthDay > getDate(lastDay)) {
            current.setDate(getDate(lastDay));
          } else {
            current.setDate(localRule.byMonthDay);
          }
        }
      }
      break;
  }

  return result;
}

function addResult(
  result: Occurrence[],
  rule: RecurrenceRule,
  date: Date,
  time: string,
  currentCount: number
): void {
  const dateStr = toISODate(date);
  const isExc = isException(rule, dateStr);
  result.push({ date: dateStr, time, isException: isExc });
}

function isException(rule: RecurrenceRule, date: string): boolean {
  return rule.exceptions ? rule.exceptions.includes(date) : false;
}

export function getNextOccurrence(
  rule: RecurrenceRule,
  startAt: string,
  afterDate: string
): string | null {
  const startDate = new Date(startAt);
  const after = new Date(afterDate + 'T00:00:00');
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
