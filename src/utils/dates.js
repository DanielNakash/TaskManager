// dates.js — ISO 'YYYY-MM-DD' date helpers, formatters, grouping, color util.
// Ported from the v1.1.0 design prototype (model.jsx).

export const MS_DAY = 86400000;
export const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const WD_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const MO = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const MO_FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export function iso(d) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
export function parseISO(s) {
  const [y, m, dd] = s.split('-').map(Number);
  return new Date(y, m - 1, dd);
}
export function todayISO() { return iso(new Date()); }
export function addDays(s, n) { const d = parseISO(s); d.setDate(d.getDate() + n); return iso(d); }
export function dayDiff(a, b) { return Math.round((parseISO(a) - parseISO(b)) / MS_DAY); }
export function ordinal(n) {
  const s = ['th', 'st', 'nd', 'rd'], v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export function fmtDate(s) { const d = parseISO(s); return WD[d.getDay()] + ', ' + MO[d.getMonth()] + ' ' + d.getDate(); }
export function fmtLong(s) { const d = parseISO(s); return WD_FULL[d.getDay()] + ', ' + MO_FULL[d.getMonth()] + ' ' + d.getDate(); }

// relative group label for a To Do date
export function groupFor(s, today) {
  const diff = dayDiff(s, today);
  if (diff < 0) return { key: 'overdue', label: 'Overdue', order: 0 };
  if (diff === 0) return { key: 'today', label: 'Today', order: 1 };
  if (diff === 1) return { key: 'tomorrow', label: 'Tomorrow', order: 2 };
  return { key: s, label: fmtDate(s), order: 3 + diff };
}

// hex -> rgba() with alpha (centralized; was duplicated across components)
export function hexA(hex, a) {
  const h = hex.replace('#', '');
  return `rgba(${parseInt(h.slice(0, 2), 16)},${parseInt(h.slice(2, 4), 16)},${parseInt(h.slice(4, 6), 16)},${a})`;
}
