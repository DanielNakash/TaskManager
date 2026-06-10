// TaskEditor.jsx — full-screen task editor (create + edit): description,
// To Do / Due dates, recurrence config, due-date modes, end date, and the
// per-occurrence edit scope. Ported from the v1.1.0 design prototype (editor.jsx).
//
// The editor works on a flattened draft `d` = { id, title, desc, toDo, due,
// done, recurrence }, where `recurrence` embeds the rule plus { endDate,
// dueMode, dueRule }. The container translates this to/from the Firestore
// series + occurrence model.
import { useState } from 'react';
import t from '../theme.js';
import { fmtLong, hexA } from '../utils/dates.js';
import { defaultRecurrence, recurSummary } from '../utils/recurrence.js';
import { Sheet, CalendarPicker } from './CalendarPicker.jsx';
import { RecurrenceFields, Segmented, Field } from './RecurrenceFields.jsx';
import { Back, Calendar, Chevron, Repeat, Flag, Alert, X, Trash } from './icons.jsx';

// a fresh recurrence draft, including the editor-only meta fields
function newRecurrence(due) {
  return { ...defaultRecurrence(), endDate: null, dueMode: due ? 'singular' : 'none', dueRule: null };
}

function DateRow({ label, value, placeholder, onClick, onClear, note, noteColor }) {
  return (
    <div>
      <div className="ft-press" onClick={onClick} style={{
        display: 'flex', alignItems: 'center', gap: 13, background: t.card, border: '1px solid ' + t.line,
        borderRadius: 13, padding: '14px 14px', cursor: 'pointer',
      }}>
        <Calendar s={19} c={t.rust} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, fontFamily: t.mono, letterSpacing: 1, textTransform: 'uppercase', color: t.faint }}>{label}</div>
          <div style={{ fontSize: 16, color: value ? t.ink : t.faint, marginTop: 2 }}>{value ? fmtLong(value) : placeholder}</div>
        </div>
        {value ? (
          <button onClick={(e) => { e.stopPropagation(); onClear(); }} className="ft-press" style={{ width: 30, height: 30, borderRadius: 8, border: 'none', background: t.surfaceAlt, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X s={14} c={t.muted} /></button>
        ) : <Chevron s={18} c={hexA(t.ink, 0.3)} />}
      </div>
      {note && (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 8, marginLeft: 4, fontSize: 12.5, fontFamily: t.mono, color: noteColor || t.due }}>
          {noteColor === t.due ? <Alert s={13} c={t.due} /> : <Flag s={13} c={noteColor || t.due} />} {note}
        </div>
      )}
    </div>
  );
}

function SectionLabel({ children }) {
  return <div style={{ fontFamily: t.mono, fontSize: 10.5, letterSpacing: 1.4, textTransform: 'uppercase', color: t.faint, margin: '22px 4px 10px' }}>{children}</div>;
}

export default function TaskEditor({ task, today, onSave, onDelete, onClose }) {
  const isNew = !task;
  const [d, setD] = useState(() => task ? { ...task } : {
    id: 'n' + Date.now(), title: '', desc: '', toDo: today, due: null, done: false, recurrence: null,
  });
  const [sheet, setSheet] = useState(null);     // 'todo' | 'due' | 'end' | null
  const [scope, setScope] = useState('all');    // recurring edit scope
  const [delSheet, setDelSheet] = useState(false);
  const up = (patch) => setD(p => ({ ...p, ...patch }));

  const repeat = !!d.recurrence;
  const r = d.recurrence;

  const toggleRepeat = () => {
    if (repeat) up({ recurrence: null });
    else up({ recurrence: newRecurrence(d.due) });
  };
  const upRule = (patch) => up({ recurrence: { ...r, ...patch } });

  // due indicator note in editor
  let note = null, noteColor = null;
  if (d.due) {
    if (d.toDo && d.due === d.toDo) { note = 'Scheduled date is also the deadline'; noteColor = t.due; }
    else if (d.due === today) { note = 'Due today'; noteColor = t.due; }
  }

  const canSave = d.title.trim().length > 0;
  const singular = repeat && r.dueMode === 'singular';

  return (
    <div style={{ height: '100%', background: t.bg, color: t.ink, fontFamily: t.body, display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {/* header */}
      <div style={{ flexShrink: 0, background: t.rust, color: '#FBF4E6', padding: '50px 14px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={onClose} className="ft-press" style={{ display: 'flex', alignItems: 'center', gap: 2, border: 'none', background: 'transparent', color: '#FBF4E6', cursor: 'pointer', fontSize: 16, fontFamily: t.body, padding: 6 }}>
          <Back s={22} c="#FBF4E6" /> Cancel
        </button>
        <div style={{ fontFamily: t.mono, fontSize: 11, letterSpacing: 2, opacity: 0.9 }}>{isNew ? 'NEW TASK' : 'EDIT TASK'}</div>
        <button onClick={() => canSave && onSave(d, scope)} className="ft-press" disabled={!canSave} style={{
          border: 'none', background: '#FBF4E6', color: t.rust, cursor: canSave ? 'pointer' : 'default', opacity: canSave ? 1 : 0.45,
          borderRadius: 10, padding: '9px 16px', fontSize: 15, fontWeight: 700, fontFamily: t.body,
        }}>Save</button>
      </div>

      <div className="ft-scroll" style={{ flex: 1, overflowY: 'auto', padding: '6px 18px 40px' }}>
        {/* recurring edit scope */}
        {!isNew && repeat && (
          <div style={{ background: hexA(t.amber, 0.14), border: '1px solid ' + hexA(t.amber, 0.4), borderRadius: 13, padding: '13px 14px', marginTop: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13.5, color: t.ink, marginBottom: 10 }}>
              <Repeat s={15} c={t.rust} /> <b>Repeating task.</b> Apply changes to:
            </div>
            <Segmented small value={scope} set={setScope} options={[
              { v: 'one', label: 'This one' }, { v: 'forward', label: 'This & future' }, { v: 'all', label: 'All' },
            ]} />
            <div style={{ fontSize: 12, color: t.muted, marginTop: 8, lineHeight: 1.4 }}>
              {scope === 'one' && 'Reschedules or edits only this occurrence — the series is untouched.'}
              {scope === 'forward' && 'Edits this and every future occurrence in place. The series is not split.'}
              {scope === 'all' && 'Edits the whole series, past and future occurrences alike.'}
            </div>
          </div>
        )}

        {/* title */}
        <SectionLabel>Title</SectionLabel>
        <input value={d.title} onChange={e => up({ title: e.target.value })} placeholder="What needs doing?" autoFocus={isNew} style={{
          width: '100%', boxSizing: 'border-box', border: '1px solid ' + t.line, background: t.card, borderRadius: 13,
          padding: '14px 14px', fontSize: 18, fontFamily: t.serif, fontWeight: 600, color: t.ink, outline: 'none',
        }} />

        {/* description */}
        <SectionLabel>Description <span style={{ textTransform: 'none', letterSpacing: 0, color: t.faint }}>· optional</span></SectionLabel>
        <textarea value={d.desc} onChange={e => up({ desc: e.target.value })} placeholder="Add detail, links, context…" rows={3} style={{
          width: '100%', boxSizing: 'border-box', border: '1px solid ' + t.line, background: t.card, borderRadius: 13,
          padding: '13px 14px', fontSize: 15.5, lineHeight: 1.5, fontFamily: t.body, color: t.ink, outline: 'none', resize: 'none',
        }} />

        {/* dates */}
        <SectionLabel>Dates</SectionLabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
          <DateRow label="To Do Date" value={d.toDo} placeholder="None — undated" onClick={() => setSheet('todo')} onClear={() => up({ toDo: null })} />
          <DateRow label={singular ? 'Due Date · singular' : 'Due Date'} value={d.due} placeholder="None" onClick={() => setSheet('due')}
            onClear={() => up({ due: null, recurrence: repeat ? { ...r, dueMode: 'none' } : null })} note={note} noteColor={noteColor} />
        </div>

        {/* repeat */}
        <SectionLabel>Recurrence</SectionLabel>
        <div className="ft-press" onClick={toggleRepeat} style={{
          display: 'flex', alignItems: 'center', gap: 12, background: t.card, border: '1px solid ' + t.line,
          borderRadius: 13, padding: '14px 14px', cursor: 'pointer',
        }}>
          <Repeat s={18} c={repeat ? t.rust : t.muted} />
          <div style={{ flex: 1, fontSize: 16, color: t.ink }}>Repeat this task</div>
          <div style={{ width: 48, height: 28, borderRadius: 999, background: repeat ? t.rust : hexA(t.ink, 0.18), position: 'relative', transition: 'background .2s' }}>
            <div style={{ position: 'absolute', top: 3, left: repeat ? 23 : 3, width: 22, height: 22, borderRadius: '50%', background: '#fff', transition: 'left .2s', boxShadow: '0 1px 3px rgba(0,0,0,0.25)' }} />
          </div>
        </div>

        {repeat && (
          <div style={{ background: t.surface, border: '1px solid ' + t.line, borderRadius: 16, padding: '16px 15px', marginTop: 11 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontFamily: t.serif, fontSize: 17, fontWeight: 600, marginBottom: 14 }}>
              <Calendar s={16} c={t.rust} /> To Do repeats…
            </div>
            <RecurrenceFields rule={r} onChange={(nr) => up({ recurrence: { ...r, ...nr } })} />

            <div style={{ fontFamily: t.mono, fontSize: 12.5, color: t.rust, background: hexA(t.rust, 0.08), borderRadius: 9, padding: '9px 12px', marginTop: 4 }}>
              ↻ {recurSummary(r)}
            </div>

            {/* due-date mode (only when a due date is set) */}
            {d.due && (
              <>
                <div style={{ height: 1, background: t.line, margin: '18px 0' }} />
                <Field label="Due date on this series">
                  <Segmented small value={r.dueMode === 'none' ? 'singular' : r.dueMode} set={(v) => upRule({ dueMode: v, dueRule: v === 'recurring' ? (r.dueRule || defaultRecurrence()) : r.dueRule })} options={[
                    { v: 'singular', label: 'Single deadline' }, { v: 'recurring', label: 'Recurring deadline' },
                  ]} />
                  <div style={{ fontSize: 12.5, color: t.muted, marginTop: 9, lineHeight: 1.45 }}>
                    {r.dueMode === 'recurring'
                      ? 'Each occurrence gets its own deadline from a separate rule. The two need not align.'
                      : 'One fixed deadline for the whole series. It also ends the recurrence — no occurrences are generated after it.'}
                  </div>
                </Field>
                {r.dueMode === 'recurring' && (
                  <div style={{ background: t.card, border: '1px solid ' + t.line, borderRadius: 13, padding: '14px 13px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontFamily: t.serif, fontSize: 16, fontWeight: 600, marginBottom: 12 }}>
                      <Flag s={14} c={t.due} /> Deadline repeats…
                    </div>
                    <RecurrenceFields rule={r.dueRule || defaultRecurrence()} onChange={(nr) => upRule({ dueRule: { ...(r.dueRule || defaultRecurrence()), ...nr } })} />
                    <div style={{ fontFamily: t.mono, fontSize: 12.5, color: t.due, background: hexA(t.due, 0.08), borderRadius: 9, padding: '9px 12px' }}>
                      ⚑ {recurSummary(r.dueRule || defaultRecurrence())}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* end date — unavailable in singular mode */}
            <div style={{ height: 1, background: t.line, margin: '18px 0' }} />
            {singular ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 13, color: t.muted, lineHeight: 1.4 }}>
                <Flag s={15} c={t.faint} />
                <span>End date is set by the single deadline — <b style={{ color: t.ink }}>{fmtLong(d.due)}</b>.</span>
              </div>
            ) : (
              <div className="ft-press" onClick={() => setSheet('end')} style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                <Calendar s={18} c={t.muted} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, fontFamily: t.mono, letterSpacing: 1, textTransform: 'uppercase', color: t.faint }}>Ends</div>
                  <div style={{ fontSize: 15.5, color: r.endDate ? t.ink : t.faint, marginTop: 2 }}>{r.endDate ? fmtLong(r.endDate) : 'Never'}</div>
                </div>
                {r.endDate
                  ? <button onClick={(e) => { e.stopPropagation(); upRule({ endDate: null }); }} className="ft-press" style={{ width: 30, height: 30, borderRadius: 8, border: 'none', background: t.surfaceAlt, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X s={14} c={t.muted} /></button>
                  : <Chevron s={18} c={hexA(t.ink, 0.3)} />}
              </div>
            )}
          </div>
        )}

        {/* delete */}
        {!isNew && (
          <button onClick={() => repeat ? setDelSheet(true) : onDelete(d.id, 'one')} className="ft-press" style={{
            marginTop: 26, width: '100%', height: 50, borderRadius: 13, border: '1px solid ' + hexA(t.due, 0.45),
            background: 'transparent', color: t.due, fontSize: 15.5, fontWeight: 600, fontFamily: t.body, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}><Trash s={18} c={t.due} /> Delete task</button>
        )}
      </div>

      {/* date sheets */}
      {sheet === 'todo' && (
        <Sheet title="To Do Date" onClose={() => setSheet(null)}>
          <CalendarPicker value={d.toDo} today={today} onPick={(v) => { up({ toDo: v }); setSheet(null); }} onClear={() => { up({ toDo: null }); setSheet(null); }} />
        </Sheet>
      )}
      {sheet === 'due' && (
        <Sheet title="Due Date" onClose={() => setSheet(null)}>
          <CalendarPicker value={d.due} today={today} onPick={(v) => { up({ due: v, recurrence: repeat ? { ...r, dueMode: r.dueMode === 'none' ? 'singular' : r.dueMode } : null }); setSheet(null); }} onClear={() => { up({ due: null }); setSheet(null); }} />
        </Sheet>
      )}
      {sheet === 'end' && (
        <Sheet title="Recurrence ends" onClose={() => setSheet(null)}>
          <CalendarPicker value={r.endDate} today={today} onPick={(v) => { upRule({ endDate: v }); setSheet(null); }} onClear={() => { upRule({ endDate: null }); setSheet(null); }} />
        </Sheet>
      )}

      {/* delete scope sheet for recurring */}
      {delSheet && (
        <Sheet title="Delete repeating task" onClose={() => setDelSheet(false)} maxH="auto">
          <div style={{ fontSize: 14.5, color: t.muted, lineHeight: 1.5, marginBottom: 16 }}>This task repeats — choose what to remove.</div>
          <button onClick={() => { setDelSheet(false); onDelete(d.id, 'one'); }} className="ft-press" style={delBtn(false)}>Delete this occurrence</button>
          <button onClick={() => { setDelSheet(false); onDelete(d.id, 'all'); }} className="ft-press" style={delBtn(true)}>Delete all occurrences</button>
        </Sheet>
      )}
    </div>
  );
}

function delBtn(strong) {
  return { width: '100%', height: 52, borderRadius: 13, marginBottom: 10, cursor: 'pointer', fontFamily: t.body, fontSize: 15.5, fontWeight: 600,
    border: strong ? 'none' : '1px solid ' + hexA(t.due, 0.45), background: strong ? t.due : 'transparent', color: strong ? '#fff' : t.due };
}
