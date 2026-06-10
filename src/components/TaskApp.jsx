// TaskApp.jsx — signed-in container. Subscribes to the user's tasks + series,
// keeps the recurrence window topped up, and routes between the All Tasks View
// and the full-screen editor. Wires the v1.1.0 UI to Firestore.
import { useState, useEffect, useRef, useMemo } from 'react';
import { collection, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { auth, db } from '../firebase.js';
import t from '../theme.js';
import { todayISO } from '../utils/dates.js';
import { topUp, saveTask, deleteTask, toggleDone, hydrateEditorTask } from '../services/series.js';
import AllTasksView from './AllTasksView.jsx';
import TaskEditor from './TaskEditor.jsx';

export default function TaskApp({ user }) {
  const uid = user.uid;
  const today = useMemo(() => todayISO(), []);

  const [tasks, setTasks] = useState([]);
  const [series, setSeries] = useState([]);
  const [showDone, setShowDone] = useState(false);
  const [editing, setEditing] = useState(null); // null | 'new' | taskId
  const [undo, setUndo] = useState(null);
  const [toast, setToast] = useState(null);
  const undoTimer = useRef(null);
  const toastTimer = useRef(null);
  const generating = useRef(false);

  const seriesById = useMemo(() => Object.fromEntries(series.map(s => [s.id, s])), [series]);

  // ── subscriptions ──
  useEffect(() => {
    const unsubT = onSnapshot(collection(db, 'users', uid, 'tasks'), snap =>
      setTasks(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubS = onSnapshot(collection(db, 'users', uid, 'series'), snap =>
      setSeries(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => { unsubT(); unsubS(); };
  }, [uid]);

  // ── keep the recurrence window materialized (idempotent, converges) ──
  useEffect(() => {
    if (series.length === 0 || generating.current) return;
    generating.current = true;
    topUp(uid, series, tasks, today)
      .catch(err => console.error('Occurrence generation failed:', err))
      .finally(() => { generating.current = false; });
  }, [uid, series, tasks, today]);

  const flash = (msg) => { setToast(msg); clearTimeout(toastTimer.current); toastTimer.current = setTimeout(() => setToast(null), 2600); };

  const handleToggle = (id) => {
    const task = tasks.find(x => x.id === id);
    if (task) toggleDone(uid, task).catch(err => console.error('Toggle failed:', err));
  };

  const handleSave = async (d, scope) => {
    setEditing(null);
    try {
      await saveTask(uid, d, scope, today, { tasks, seriesById });
      if (d.recurrence && scope === 'one') flash('Rescheduled this occurrence only');
      else if (d.recurrence && scope === 'forward') flash('Updated this & future occurrences');
      else flash('Saved');
    } catch (err) {
      console.error('Save failed:', err);
      flash('Could not save — try again');
    }
  };

  const handleDelete = async (id, scope) => {
    const task = tasks.find(x => x.id === id);
    setEditing(null);
    if (!task) return;
    try {
      await deleteTask(uid, { id, ...task }, scope, { tasks, seriesById });
    } catch (err) {
      console.error('Delete failed:', err);
      flash('Could not delete — try again');
      return;
    }
    // Undo is offered for standalone deletes (recreatable); recurring deletes just confirm.
    if (!task.seriesId) {
      setUndo({ data: { title: task.title, desc: task.desc || '', toDo: task.toDo ?? null, due: task.due ?? null, done: !!task.done, seriesId: null, occurrenceDate: null, overridden: false } });
      clearTimeout(undoTimer.current);
      undoTimer.current = setTimeout(() => setUndo(null), 4500);
      flash('Task deleted');
    } else {
      flash(scope === 'all' ? 'Deleted all occurrences' : 'Occurrence deleted');
    }
  };

  const doUndo = async () => {
    if (!undo) return;
    clearTimeout(undoTimer.current);
    try {
      await addDoc(collection(db, 'users', uid, 'tasks'), { ...undo.data, createdAt: serverTimestamp() });
    } catch (err) { console.error('Undo failed:', err); }
    setUndo(null);
  };

  const handleSignOut = () => signOut(auth);

  // editor view
  if (editing) {
    const raw = editing === 'new' ? null : tasks.find(x => x.id === editing);
    const editorTask = raw ? hydrateEditorTask(raw, seriesById[raw.seriesId]) : null;
    return <TaskEditor task={editorTask} today={today} onSave={handleSave} onDelete={handleDelete} onClose={() => setEditing(null)} />;
  }

  // list view — attach each occurrence's rule for the row summary
  const displayTasks = tasks.map(x => ({
    ...x,
    recurrence: x.seriesId ? (seriesById[x.seriesId]?.rule ?? null) : null,
  }));

  return (
    <>
      <AllTasksView
        tasks={displayTasks} today={today} showDone={showDone} setShowDone={setShowDone}
        onOpen={(id) => setEditing(id)} onToggle={handleToggle} onAdd={() => setEditing('new')} onSignOut={handleSignOut}
      />

      {toast && !undo && (
        <div className="ft-toast" style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', bottom: 100, zIndex: 45, background: t.ink, color: t.surface, borderRadius: 999, padding: '10px 18px', fontSize: 13.5, fontFamily: t.body, whiteSpace: 'nowrap', boxShadow: '0 10px 26px rgba(0,0,0,0.25)' }}>{toast}</div>
      )}
      {undo && (
        <div className="ft-toast" style={{ position: 'absolute', left: 18, right: 18, bottom: 30, zIndex: 46, height: 52, borderRadius: 14, background: t.ink, color: t.surface, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 8px 0 18px', fontSize: 14.5, fontFamily: t.body, boxShadow: '0 14px 30px rgba(0,0,0,0.25)' }}>
          <span>{toast || 'Task deleted'}</span>
          <button onClick={doUndo} style={{ border: 'none', background: 'transparent', color: t.amber, fontWeight: 700, fontSize: 14.5, padding: '10px 14px', cursor: 'pointer', fontFamily: t.body, letterSpacing: 0.3 }}>UNDO</button>
        </div>
      )}
    </>
  );
}
