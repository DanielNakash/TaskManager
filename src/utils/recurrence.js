// recurrence.js — recurrence rule helpers + the occurrence-generation engine.
//
// Rules use the shape produced by defaultRecurrence(). All dates are ISO
// 'YYYY-MM-DD' strings. Everything here is pure and unit-tested
// (see recurrence.test.js) so it can be verified without Firebase.

import { iso, parseISO, ordinal, WD, WD_FULL } from './dates.js';

// ── rule defaults + human summary ─────────────────────────────
export function defaultRecurrence() {
  const now = new Date();
  return {
    pattern: 'weekday', interval: 1, unit: 'week', weekdays: [now.getDay()],
    weekInterval: 1, monthMode: 'date', monthDate: now.getDate(), monthWeekPos: 1,
    monthWeekday: now.getDay(), monthInterval: 1,
  };
}

export function recurSummary(r) {
  if (!r) return '';
  if (r.pattern === 'interval') {
    return r.interval === 1 ? ('Every ' + r.unit) : ('Every ' + r.interval + ' ' + r.unit + 's');
  }
  if (r.pattern === 'weekday') {
    const days = r.weekdays.slice().sort((a, b) => a - b).map(d => WD_FULL[d]);
    let s = days.length === 7 ? 'Every day'
      : days.length === 0 ? 'Weekly'
        : 'Every ' + (days.length > 2 ? days.map(d => d.slice(0, 3)).join(', ') : days.join(' & '));
    if (r.weekInterval > 1) s += ', every ' + r.weekInterval + ' weeks';
    return s;
  }
  if (r.pattern === 'monthday') {
    const ord = ['', 'first', 'second', 'third', 'fourth', 'fifth'];
    let base = r.monthMode === 'date'
      ? 'The ' + ordinal(r.monthDate)
      : 'The ' + (r.monthWeekPos === -1 ? 'last' : ord[r.monthWeekPos]) + ' ' + WD_FULL[r.monthWeekday];
    base += r.monthInterval === 1 ? ' of every month' : ' of every ' + r.monthInterval + ' months';
    return base;
  }
  return '';
}

// ── date math helpers ─────────────────────────────────────────
const MAX_ITERS = 4000; // hard cap so a bad rule can never loop forever

function addMonthsClamped(y, m, day) {
  // y/m may be out of range (m can exceed 11); normalize, then clamp day.
  const base = new Date(y, m, 1);
  const yy = base.getFullYear(), mm = base.getMonth();
  const lastDay = new Date(yy, mm + 1, 0).getDate();
  return new Date(yy, mm, Math.min(day, lastDay));
}

// nth (1-based) weekday in a month, or last when pos === -1
function nthWeekdayOfMonth(y, m, weekday, pos) {
  if (pos === -1) {
    const last = new Date(y, m + 1, 0);
    const back = (last.getDay() - weekday + 7) % 7;
    return new Date(y, m, last.getDate() - back);
  }
  const first = new Date(y, m, 1);
  const fwd = (weekday - first.getDay() + 7) % 7;
  const day = 1 + fwd + (pos - 1) * 7;
  const lastDay = new Date(y, m + 1, 0).getDate();
  return day > lastDay ? null : new Date(y, m, day);
}

// ── enumerateDates(rule, anchor, from, to) ────────────────────
// All ISO dates the rule produces in [from, to], phase-aligned to `anchor`.
// Never returns dates earlier than `anchor`.
export function enumerateDates(rule, anchor, from, to) {
  if (!rule || !anchor || !from || !to || from > to) return [];
  const a = parseISO(anchor);
  const lo = from < anchor ? anchor : from; // never before the anchor
  const out = [];
  const push = (d) => { const s = iso(d); if (s >= lo && s <= to) out.push(s); };

  if (rule.pattern === 'interval') {
    const stepDays = rule.unit === 'day' ? rule.interval : rule.unit === 'week' ? rule.interval * 7 : 0;
    for (let k = 0; k < MAX_ITERS; k++) {
      let d;
      if (rule.unit === 'month') d = addMonthsClamped(a.getFullYear(), a.getMonth() + k * rule.interval, a.getDate());
      else { d = new Date(a); d.setDate(d.getDate() + k * stepDays); }
      if (iso(d) > to) break;
      push(d);
    }
    return dedupeSorted(out);
  }

  if (rule.pattern === 'weekday') {
    const weekStart = new Date(a); weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Sunday
    const days = (rule.weekdays || []).slice().sort((x, y) => x - y);
    for (let w = 0; w < MAX_ITERS; w++) {
      const ws = new Date(weekStart); ws.setDate(ws.getDate() + w * 7);
      if (iso(ws) > to) break; // week's Sunday already past `to`; no later day qualifies
      if (w % (rule.weekInterval || 1) === 0) {
        for (const wd of days) { const d = new Date(ws); d.setDate(d.getDate() + wd); push(d); }
      }
    }
    return dedupeSorted(out);
  }

  if (rule.pattern === 'monthday') {
    for (let k = 0; k < MAX_ITERS; k++) {
      const monthStart = new Date(a.getFullYear(), a.getMonth() + k, 1);
      if (iso(monthStart) > to) break;
      if (k % (rule.monthInterval || 1) === 0) {
        let d;
        if (rule.monthMode === 'date') {
          d = addMonthsClamped(monthStart.getFullYear(), monthStart.getMonth(), rule.monthDate);
        } else {
          d = nthWeekdayOfMonth(monthStart.getFullYear(), monthStart.getMonth(), rule.monthWeekday, rule.monthWeekPos);
        }
        if (d) push(d);
      }
    }
    return dedupeSorted(out);
  }

  return [];
}

function dedupeSorted(arr) {
  return [...new Set(arr)].sort();
}

// smallest ISO date among the provided (ignoring null/undefined), or null
function minDate(...ds) {
  const vals = ds.filter(Boolean);
  return vals.length ? vals.reduce((m, d) => (d < m ? d : m)) : null;
}

// ── computeDue(series, toDoList, anchor, end) ─────────────────
// Due date per occurrence index, aligned to toDoList.
export function computeDue(series, toDoList, anchor, end) {
  if (series.dueMode === 'singular') return toDoList.map(() => series.dueSingular || null);
  if (series.dueMode === 'recurring' && series.dueRule) {
    const dues = enumerateDates(series.dueRule, anchor, anchor, end);
    return toDoList.map((_, i) => dues[i] || null);
  }
  return toDoList.map(() => null);
}

// ── planOccurrences(series, horizon, existingDates) ───────────
// Returns the occurrences that should exist but don't yet:
//   { create: [{ occurrenceDate, toDo, due }], generatedThrough }
// `existingDates` is a Set of occurrenceDates already materialized.
export function planOccurrences(series, horizon, existingDates = new Set()) {
  const anchor = series.ruleAnchor || series.startDate;
  if (!anchor) return { create: [], generatedThrough: horizon };

  // end bound: earliest of horizon, series end date, and singular deadline
  const singularEnd = series.dueMode === 'singular' ? series.dueSingular : null;
  const end = minDate(horizon, series.endDate, singularEnd);
  if (!end) return { create: [], generatedThrough: horizon };

  const fullToDo = enumerateDates(series.rule, anchor, anchor, end);
  const dues = computeDue(series, fullToDo, anchor, end);
  const exceptions = new Set(series.exceptions || []);

  const create = [];
  fullToDo.forEach((occ, i) => {
    if (exceptions.has(occ) || existingDates.has(occ)) return;
    create.push({ occurrenceDate: occ, toDo: occ, due: dues[i] || null });
  });

  return { create, generatedThrough: end };
}
