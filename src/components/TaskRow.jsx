// TaskRow.jsx — All Tasks View display row. Tapping opens the editor; shows the
// recurrence summary and the Due Date indicators. Ported from list.jsx.
import t from '../theme.js';
import { hexA } from '../utils/dates.js';
import { recurSummary } from '../utils/recurrence.js';
import { Check, Repeat, Flag, Alert, Chevron } from './icons.jsx';

// Which Due Date indicator (if any) a task should show today.
export function dueIndicator(task, today) {
  if (!task.due) return null;
  if (task.toDo && task.due === task.toDo) return 'deadline';        // persistent: scheduled date is the deadline
  if (task.due === today && task.toDo !== task.due) return 'today';  // due-today note
  return null;
}

export default function TaskRow({ task, today, onOpen, onToggle }) {
  const ind = dueIndicator(task, today);
  return (
    <div className="ft-press" onClick={onOpen} style={{
      display: 'flex', alignItems: 'center', gap: 13, padding: '15px 4px',
      borderBottom: '1px solid ' + t.line, cursor: 'pointer', opacity: task.done ? 0.6 : 1,
    }}>
      <button onClick={(e) => { e.stopPropagation(); onToggle(); }} className="ft-press" title="Toggle done" style={{
        flexShrink: 0, width: 26, height: 26, padding: 0, cursor: 'pointer',
        border: '2px solid ' + (task.done ? t.rust : hexA(t.ink, 0.3)),
        borderRadius: 7, background: task.done ? t.rust : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>{task.done && <Check s={15} />}</button>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 16.5, lineHeight: 1.3, color: task.done ? t.muted : t.ink,
          textDecoration: task.done ? 'line-through' : 'none', textDecorationColor: hexA(t.rust, 0.5),
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{task.title}</div>

        {(task.recurrence || ind) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 5, flexWrap: 'wrap' }}>
            {task.recurrence && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11.5, color: t.muted, fontFamily: t.mono, whiteSpace: 'nowrap' }}>
                <Repeat s={13} c={t.muted} /> {recurSummary(task.recurrence)}
              </span>
            )}
            {ind === 'deadline' && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontFamily: t.mono, whiteSpace: 'nowrap',
                color: t.due, border: '1px solid ' + hexA(t.due, 0.4), borderRadius: 4, padding: '1px 6px', letterSpacing: 0.3 }}>
                <Flag s={11} c={t.due} /> DEADLINE
              </span>
            )}
            {ind === 'today' && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontFamily: t.mono, whiteSpace: 'nowrap',
                color: '#fff', background: t.due, borderRadius: 4, padding: '2px 6px', letterSpacing: 0.3 }}>
                <Alert s={11} c="#fff" /> DUE TODAY
              </span>
            )}
          </div>
        )}
      </div>
      <Chevron s={18} c={hexA(t.ink, 0.28)} />
    </div>
  );
}
