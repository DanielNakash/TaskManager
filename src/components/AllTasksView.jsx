// AllTasksView.jsx — primary landing view: tasks grouped by To Do Date
// (Overdue / Today / Tomorrow / dated, oldest→newest), undated group at the
// bottom, Done hidden behind a toggle. Ported from list.jsx.
import t from '../theme.js';
import { groupFor, fmtLong, hexA } from '../utils/dates.js';
import TaskRow from './TaskRow.jsx';
import { Eye, Plus } from './icons.jsx';

function GroupHeader({ label, count, accent }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '22px 4px 8px' }}>
      <span style={{ fontFamily: t.mono, fontSize: 11.5, letterSpacing: 1.5, textTransform: 'uppercase',
        color: accent || t.muted, fontWeight: 600 }}>{label}</span>
      <span style={{ fontFamily: t.mono, fontSize: 11.5, color: t.faint }}>{count}</span>
      <div style={{ flex: 1, height: 1, background: t.line }} />
    </div>
  );
}

export default function AllTasksView({ tasks, today, showDone, setShowDone, onOpen, onToggle, onAdd, onSignOut }) {
  const active = tasks.filter(x => !x.done);
  const doneTasks = tasks.filter(x => x.done);
  const total = tasks.length, doneCount = doneTasks.length;
  const pct = total ? Math.round((doneCount / total) * 100) : 0;

  // dated active tasks sorted oldest -> newest, then grouped
  const dated = active.filter(x => x.toDo).sort((a, b) => a.toDo.localeCompare(b.toDo));
  const undated = active.filter(x => !x.toDo);

  const groups = [];
  const byKey = {};
  dated.forEach(x => {
    const g = groupFor(x.toDo, today);
    if (!byKey[g.key]) { byKey[g.key] = { ...g, items: [] }; groups.push(byKey[g.key]); }
    byKey[g.key].items.push(x);
  });
  groups.sort((a, b) => a.order - b.order);

  return (
    <div style={{ height: '100%', background: t.bg, color: t.ink, fontFamily: t.body, display: 'flex', flexDirection: 'column' }}>
      {/* header */}
      <div style={{ flexShrink: 0, background: t.rust, color: '#FBF4E6', padding: '54px 18px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: t.mono, fontSize: 11, letterSpacing: 3, opacity: 0.85, whiteSpace: 'nowrap' }}>DON'T PANIC</span>
          <button onClick={onSignOut} title="Sign out" style={{ width: 38, height: 38, border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 20 }}>🦊</button>
        </div>
        <h1 style={{ margin: '6px 0 0', fontFamily: t.serif, fontSize: 38, fontWeight: 600, letterSpacing: -0.4, lineHeight: 1, color: '#FBF4E6' }}>All Tasks</h1>
        <div style={{ marginTop: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontFamily: t.mono, fontSize: 11.5, letterSpacing: 0.5, opacity: 0.92 }}>
            <span style={{ whiteSpace: 'nowrap' }}>{fmtLong(today).toUpperCase()}</span>
            <span style={{ whiteSpace: 'nowrap' }}>{doneCount}/{total} DONE</span>
          </div>
          <div style={{ marginTop: 8, height: 10, borderRadius: 6, background: 'rgba(255,255,255,0.22)', overflow: 'hidden' }}>
            <div style={{ width: pct + '%', height: '100%', background: t.amber, borderRadius: 6, transition: 'width .45s cubic-bezier(.2,.8,.2,1)' }} />
          </div>
        </div>
      </div>

      {/* list */}
      <div className="ft-scroll" style={{ flex: 1, overflowY: 'auto', padding: '0 18px 120px', position: 'relative' }}>
        {/* done toggle bar */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 12 }}>
          <button onClick={() => setShowDone(v => !v)} className="ft-press" style={{
            display: 'inline-flex', alignItems: 'center', gap: 7, cursor: 'pointer',
            background: showDone ? t.surface : 'transparent', border: '1px solid ' + t.line,
            borderRadius: 999, padding: '7px 13px', color: t.muted, fontFamily: t.mono,
            fontSize: 11.5, letterSpacing: 0.5,
          }}>
            <Eye s={15} c={t.muted} off={!showDone} />
            {showDone ? 'HIDE DONE' : 'SHOW DONE'}
          </button>
        </div>

        {groups.map(g => (
          <div key={g.key}>
            <GroupHeader label={g.label} count={g.items.length} accent={g.key === 'overdue' ? t.due : (g.key === 'today' ? t.rust : null)} />
            {g.items.map(x => <TaskRow key={x.id} task={x} today={today} onOpen={() => onOpen(x.id)} onToggle={() => onToggle(x.id)} />)}
          </div>
        ))}

        {undated.length > 0 && (
          <div>
            <GroupHeader label="No date" count={undated.length} />
            {undated.map(x => <TaskRow key={x.id} task={x} today={today} onOpen={() => onOpen(x.id)} onToggle={() => onToggle(x.id)} />)}
          </div>
        )}

        {active.length === 0 && (
          <div style={{ textAlign: 'center', padding: '54px 30px 20px' }}>
            <div style={{ fontSize: 46, transform: 'rotate(-6deg)' }}>🦊</div>
            <div style={{ fontFamily: t.serif, fontSize: 22, fontWeight: 600, marginTop: 8 }}>All clear.</div>
            <p style={{ color: t.muted, fontSize: 15, maxWidth: 220, margin: '6px auto 0', lineHeight: 1.5 }}>Nothing left on the list. Go read a book.</p>
          </div>
        )}

        {showDone && doneTasks.length > 0 && (
          <div>
            <GroupHeader label="Done" count={doneTasks.length} />
            {doneTasks.map(x => <TaskRow key={x.id} task={x} today={today} onOpen={() => onOpen(x.id)} onToggle={() => onToggle(x.id)} />)}
          </div>
        )}
      </div>

      {/* FAB */}
      <button onClick={onAdd} className="ft-press" title="New task" style={{
        position: 'absolute', right: 20, bottom: 30, zIndex: 30, width: 60, height: 60, borderRadius: '50%',
        border: 'none', background: t.rust, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 12px 26px ' + hexA(t.rust, 0.45),
      }}><Plus s={26} /></button>
    </div>
  );
}
