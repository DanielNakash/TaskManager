// series.js — Firestore layer for recurring task series + their occurrences.
//
// Two collections per user:
//   users/{uid}/tasks   — occurrences AND standalone tasks
//   users/{uid}/series  — recurrence rules
//
// Occurrence docs use a deterministic id `${seriesId}__${occurrenceDate}` so
// generation is idempotent and concurrent clients can't duplicate a slot.
import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  writeBatch, serverTimestamp, arrayUnion,
} from 'firebase/firestore';
import { db } from '../firebase.js';
import { addDays } from '../utils/dates.js';
import { planOccurrences } from '../utils/recurrence.js';

const HORIZON_DAYS = 60;
const RULE_KEYS = ['pattern', 'interval', 'unit', 'weekdays', 'weekInterval',
  'monthMode', 'monthDate', 'monthWeekPos', 'monthWeekday', 'monthInterval'];

const tasksCol = (uid) => collection(db, 'users', uid, 'tasks');
const seriesCol = (uid) => collection(db, 'users', uid, 'series');
const taskDoc = (uid, id) => doc(db, 'users', uid, 'tasks', id);
const seriesDoc = (uid, id) => doc(db, 'users', uid, 'series', id);

// ── editor <-> model translation ──────────────────────────────
function pickRule(rec) {
  const r = {};
  for (const k of RULE_KEYS) if (rec[k] !== undefined) r[k] = rec[k];
  return r;
}

// Split the editor's flattened `recurrence` into series fields.
function splitRecurrence(rec) {
  return {
    rule: pickRule(rec),
    endDate: rec.endDate ?? null,
    dueMode: rec.dueMode ?? 'none',
    dueRule: rec.dueRule ? pickRule(rec.dueRule) : null,
  };
}

// Flattened recurrence object for the editor (rule + meta), or null.
export function flattenSeries(series) {
  if (!series) return null;
  return { ...series.rule, endDate: series.endDate ?? null, dueMode: series.dueMode ?? 'none', dueRule: series.dueRule ?? null };
}

// Build the editor draft for an existing task (occurrence or standalone).
export function hydrateEditorTask(task, series) {
  return {
    id: task.id,
    title: task.title ?? '',
    desc: task.desc ?? '',
    toDo: task.toDo ?? null,
    due: task.due ?? null,
    done: !!task.done,
    recurrence: flattenSeries(series),
    seriesId: task.seriesId ?? null,
    occurrenceDate: task.occurrenceDate ?? null,
  };
}

function seriesPayload(d, anchor) {
  const { rule, endDate, dueMode, dueRule } = splitRecurrence(d.recurrence);
  return {
    title: d.title.trim(),
    desc: d.desc || '',
    rule,
    ruleAnchor: anchor,
    startDate: anchor,
    endDate: endDate || null,
    dueMode: dueMode || 'none',
    dueRule: dueMode === 'recurring' ? (dueRule || null) : null,
    dueSingular: dueMode === 'singular' ? (d.due || null) : null,
  };
}

// ── generation ────────────────────────────────────────────────
// Materialize any missing occurrences for one series up to the horizon.
// `existingDates` is a Set of occurrenceDates already present. Returns the
// number of occurrences created (0 when already topped up).
async function generate(uid, seriesId, series, existingDates, today) {
  const horizon = addDays(today, HORIZON_DAYS);
  const { create, generatedThrough } = planOccurrences({ ...series, id: seriesId }, horizon, existingDates);
  if (create.length === 0) return 0;

  const batch = writeBatch(db);
  for (const c of create) {
    batch.set(taskDoc(uid, `${seriesId}__${c.occurrenceDate}`), {
      title: series.title,
      desc: series.desc || '',
      toDo: c.toDo,
      due: c.due,
      done: false,
      seriesId,
      occurrenceDate: c.occurrenceDate,
      overridden: false,
      createdAt: serverTimestamp(),
    });
  }
  batch.update(seriesDoc(uid, seriesId), { generatedThrough });
  await batch.commit();
  return create.length;
}

// Top up every series from a loaded snapshot. Idempotent; only writes when
// there are new slots, so it converges and won't loop on the subscription.
export async function topUp(uid, seriesList, tasks, today) {
  const datesBySeries = {};
  for (const t of tasks) {
    if (!t.seriesId) continue;
    (datesBySeries[t.seriesId] ||= new Set()).add(t.occurrenceDate);
  }
  let created = 0;
  for (const s of seriesList) {
    created += await generate(uid, s.id, s, datesBySeries[s.id] || new Set(), today);
  }
  return created;
}

function occurrencesOf(tasks, seriesId) {
  return tasks.filter(t => t.seriesId === seriesId);
}

// ── saving ────────────────────────────────────────────────────
// d: editor draft; scope: 'one' | 'forward' | 'all' (recurring edits only).
// ctx: { tasks, seriesById } from the live snapshot.
export async function saveTask(uid, d, scope, today, ctx) {
  const existing = ctx.tasks.find(t => t.id === d.id);
  const rec = d.recurrence;

  // ── non-recurring result ──
  if (!rec) {
    if (existing?.seriesId && scope === 'all') {
      // recurrence turned off for the whole series → collapse to a standalone task
      await deleteSeriesAndOccurrences(uid, existing.seriesId, ctx.tasks);
    }
    const payload = {
      title: d.title.trim(), desc: d.desc || '', toDo: d.toDo ?? null, due: d.due ?? null,
      done: !!d.done, seriesId: null, occurrenceDate: null, overridden: false,
    };
    if (existing && !(existing.seriesId && scope === 'all')) {
      await updateDoc(taskDoc(uid, d.id), payload);
    } else {
      await addDoc(tasksCol(uid), { ...payload, createdAt: serverTimestamp() });
    }
    return;
  }

  // ── recurring result ──
  // new recurring task, or a standalone being converted into one
  if (!existing || !existing.seriesId) {
    const anchor = d.toDo || today;
    const ref = await addDoc(seriesCol(uid), { ...seriesPayload(d, anchor), exceptions: [], generatedThrough: anchor, createdAt: serverTimestamp() });
    if (existing) await deleteDoc(taskDoc(uid, d.id)); // drop the old standalone doc
    await generate(uid, ref.id, { ...seriesPayload(d, anchor), exceptions: [] }, new Set(), today);
    return;
  }

  // editing an existing recurring occurrence
  const series = ctx.seriesById[existing.seriesId];
  if (!series) return;

  if (scope === 'one') {
    // reschedule / edit this occurrence only — series untouched
    await updateDoc(taskDoc(uid, d.id), {
      title: d.title.trim(), desc: d.desc || '', toDo: d.toDo ?? null, due: d.due ?? null, overridden: true,
    });
    return;
  }

  const chosen = existing.occurrenceDate || existing.toDo;
  const anchor = scope === 'forward' ? chosen : (series.startDate || chosen);
  await updateDoc(seriesDoc(uid, existing.seriesId), {
    ...seriesPayload(d, anchor),
    startDate: series.startDate || anchor, // 'all' keeps original start; 'forward' anchors at chosen
    generatedThrough: anchor,
  });

  // remove auto-generated, not-done occurrences that the new rule will replace
  const occ = occurrencesOf(ctx.tasks, existing.seriesId);
  const batch = writeBatch(db);
  for (const o of occ) {
    const inRange = scope === 'all' ? true : (o.occurrenceDate >= chosen);
    if (inRange && !o.overridden && !o.done) batch.delete(taskDoc(uid, o.id));
    else if (inRange) batch.update(taskDoc(uid, o.id), { title: d.title.trim(), desc: d.desc || '' }); // keep overridden/done, refresh text
  }
  await batch.commit();

  const remaining = occurrencesOf(ctx.tasks, existing.seriesId)
    .filter(o => (scope === 'all' ? false : o.occurrenceDate < chosen) || o.overridden || o.done);
  const existingDates = new Set(remaining.map(o => o.occurrenceDate));
  await generate(uid, existing.seriesId, { ...series, ...seriesPayload(d, anchor), startDate: series.startDate || anchor, exceptions: series.exceptions || [] }, existingDates, today);
}

// ── deleting ──────────────────────────────────────────────────
async function deleteSeriesAndOccurrences(uid, seriesId, tasks) {
  const batch = writeBatch(db);
  batch.delete(seriesDoc(uid, seriesId));
  for (const o of occurrencesOf(tasks, seriesId)) batch.delete(taskDoc(uid, o.id));
  await batch.commit();
}

export async function deleteTask(uid, d, scope, ctx) {
  const existing = ctx.tasks.find(t => t.id === d.id);
  if (!existing) return;

  if (!existing.seriesId) { await deleteDoc(taskDoc(uid, d.id)); return; }

  if (scope === 'all') {
    await deleteSeriesAndOccurrences(uid, existing.seriesId, ctx.tasks);
    return;
  }
  // delete just this occurrence and record it as an exception so it never regenerates
  await deleteDoc(taskDoc(uid, d.id));
  if (existing.occurrenceDate) {
    await updateDoc(seriesDoc(uid, existing.seriesId), { exceptions: arrayUnion(existing.occurrenceDate) });
  }
}

// ── toggling done (occurrence or standalone) ──────────────────
export async function toggleDone(uid, task) {
  await updateDoc(taskDoc(uid, task.id), { done: !task.done });
}
