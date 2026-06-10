import { describe, it, expect } from 'vitest';
import { enumerateDates, computeDue, planOccurrences, recurSummary } from './recurrence.js';

// Helpers to build rules tersely
const interval = (interval, unit) => ({ pattern: 'interval', interval, unit });
const weekday = (weekdays, weekInterval = 1) => ({ pattern: 'weekday', weekdays, weekInterval });
const monthDate = (monthDate, monthInterval = 1) => ({ pattern: 'monthday', monthMode: 'date', monthDate, monthInterval });
const monthWk = (monthWeekday, monthWeekPos, monthInterval = 1) =>
  ({ pattern: 'monthday', monthMode: 'weekday', monthWeekday, monthWeekPos, monthInterval });

describe('enumerateDates — interval', () => {
  it('every 3 days', () => {
    expect(enumerateDates(interval(3, 'day'), '2026-06-01', '2026-06-01', '2026-06-12'))
      .toEqual(['2026-06-01', '2026-06-04', '2026-06-07', '2026-06-10']);
  });
  it('every 2 weeks', () => {
    expect(enumerateDates(interval(2, 'week'), '2026-06-01', '2026-06-01', '2026-07-01'))
      .toEqual(['2026-06-01', '2026-06-15', '2026-06-29']);
  });
  it('every 2 months, clamps short months', () => {
    // anchor Jan 31 -> Mar 31 -> May 31 (Feb/Apr clamp not hit at 2-month step)
    expect(enumerateDates(interval(1, 'month'), '2026-01-31', '2026-01-31', '2026-04-30'))
      .toEqual(['2026-01-31', '2026-02-28', '2026-03-31', '2026-04-30']);
  });
  it('respects the `from` lower bound but stays phase-aligned to anchor', () => {
    expect(enumerateDates(interval(3, 'day'), '2026-06-01', '2026-06-05', '2026-06-12'))
      .toEqual(['2026-06-07', '2026-06-10']);
  });
});

describe('enumerateDates — weekday', () => {
  it('every Monday & Thursday, weekly', () => {
    // 2026-06-01 is a Monday
    expect(enumerateDates(weekday([1, 4]), '2026-06-01', '2026-06-01', '2026-06-14'))
      .toEqual(['2026-06-01', '2026-06-04', '2026-06-08', '2026-06-11']);
  });
  it('every Tuesday, every 2 weeks', () => {
    // anchor Mon 2026-06-01; Tuesdays in on-weeks (w%2==0): 06-02, then skip 06-09, 06-16
    expect(enumerateDates(weekday([2], 2), '2026-06-01', '2026-06-01', '2026-06-30'))
      .toEqual(['2026-06-02', '2026-06-16', '2026-06-30']);
  });
  it('never emits a selected weekday earlier than the anchor', () => {
    // anchor Wed 2026-06-03, Monday selected -> first Monday is 06-08, not 06-01
    expect(enumerateDates(weekday([1]), '2026-06-03', '2026-06-03', '2026-06-15'))
      .toEqual(['2026-06-08', '2026-06-15']);
  });
});

describe('enumerateDates — monthday', () => {
  it('the 25th of every 2 months', () => {
    expect(enumerateDates(monthDate(25, 2), '2026-01-25', '2026-01-25', '2026-06-30'))
      .toEqual(['2026-01-25', '2026-03-25', '2026-05-25']);
  });
  it('the first Sunday of every month', () => {
    expect(enumerateDates(monthWk(0, 1), '2026-06-01', '2026-06-01', '2026-08-31'))
      .toEqual(['2026-06-07', '2026-07-05', '2026-08-02']);
  });
  it('the last Friday of every month', () => {
    expect(enumerateDates(monthWk(5, -1), '2026-06-01', '2026-06-01', '2026-08-31'))
      .toEqual(['2026-06-26', '2026-07-31', '2026-08-28']);
  });
});

describe('computeDue', () => {
  const base = { startDate: '2026-06-01', ruleAnchor: '2026-06-01', rule: weekday([1]) };
  it('none -> all null', () => {
    expect(computeDue({ ...base, dueMode: 'none' }, ['2026-06-01', '2026-06-08'], '2026-06-01', '2026-06-30'))
      .toEqual([null, null]);
  });
  it('singular -> deadline on every occurrence', () => {
    expect(computeDue({ ...base, dueMode: 'singular', dueSingular: '2026-07-01' }, ['2026-06-01', '2026-06-08'], '2026-06-01', '2026-07-01'))
      .toEqual(['2026-07-01', '2026-07-01']);
  });
  it('recurring -> independent rule paired by index (Mon To Do / Fri Due)', () => {
    const s = { ...base, dueMode: 'recurring', dueRule: weekday([5]) };
    const toDo = enumerateDates(s.rule, '2026-06-01', '2026-06-01', '2026-06-21');
    expect(computeDue(s, toDo, '2026-06-01', '2026-06-21'))
      .toEqual(['2026-06-05', '2026-06-12', '2026-06-19']);
  });
});

describe('planOccurrences', () => {
  const series = {
    startDate: '2026-06-01', ruleAnchor: '2026-06-01', rule: weekday([1]),
    dueMode: 'none', endDate: null, exceptions: [],
  };
  it('generates To Do occurrences up to the horizon', () => {
    const { create } = planOccurrences(series, '2026-06-30');
    expect(create.map(c => c.occurrenceDate)).toEqual(['2026-06-01', '2026-06-08', '2026-06-15', '2026-06-22', '2026-06-29']);
  });
  it('is idempotent — skips already-materialized slots', () => {
    const existing = new Set(['2026-06-01', '2026-06-08']);
    const { create } = planOccurrences(series, '2026-06-30', existing);
    expect(create.map(c => c.occurrenceDate)).toEqual(['2026-06-15', '2026-06-22', '2026-06-29']);
  });
  it('honors exceptions (deleted slots never regenerate)', () => {
    const { create } = planOccurrences({ ...series, exceptions: ['2026-06-15'] }, '2026-06-30');
    expect(create.map(c => c.occurrenceDate)).toEqual(['2026-06-01', '2026-06-08', '2026-06-22', '2026-06-29']);
  });
  it('stops at the end date', () => {
    const { create } = planOccurrences({ ...series, endDate: '2026-06-15' }, '2026-06-30');
    expect(create.map(c => c.occurrenceDate)).toEqual(['2026-06-01', '2026-06-08', '2026-06-15']);
  });
  it('singular due bounds the series and stamps every occurrence', () => {
    const s = { ...series, dueMode: 'singular', dueSingular: '2026-06-15' };
    const { create } = planOccurrences(s, '2026-06-30');
    expect(create.map(c => c.occurrenceDate)).toEqual(['2026-06-01', '2026-06-08', '2026-06-15']);
    expect(create.every(c => c.due === '2026-06-15')).toBe(true);
  });
});

describe('recurSummary', () => {
  it('interval', () => expect(recurSummary(interval(3, 'day'))).toBe('Every 3 days'));
  it('weekday with interval', () => expect(recurSummary(weekday([1, 4], 2))).toBe('Every Monday & Thursday, every 2 weeks'));
  it('three weekdays use comma join', () => expect(recurSummary(weekday([1, 3, 5]))).toBe('Every Mon, Wed, Fri'));
  it('monthday weekday', () => expect(recurSummary(monthWk(0, -1))).toBe('The last Sunday of every month'));
});
