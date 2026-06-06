import { useState, useEffect, useRef } from 'react';
import {
  collection, onSnapshot, addDoc, updateDoc, deleteDoc,
  doc, serverTimestamp, query, orderBy,
} from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { auth, db } from '../firebase.js';
import t from '../theme.js';
import Header from './Header.jsx';
import GroupLabel from './GroupLabel.jsx';
import TaskRow from './TaskRow.jsx';
import EmptyState from './EmptyState.jsx';
import ComposerSheet from './ComposerSheet.jsx';
import { Plus } from './icons.jsx';

export default function TaskList({ user }) {
  const [tasks, setTasks] = useState([]);
  const [composerOpen, setComposerOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState('');
  const [undo, setUndo] = useState(null); // { task, docData }
  const undoTimer = useRef(null);
  // freshIds: set of task IDs that just got created (for pop-in animation)
  const freshIds = useRef(new Set());

  // Subscribe to tasks in Firestore
  useEffect(() => {
    const q = query(
      collection(db, 'users', user.uid, 'tasks'),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, snap => {
      setTasks(snap.docs.map(d => ({
        id: d.id,
        ...d.data(),
        fresh: freshIds.current.has(d.id),
      })));
      // Clear fresh flags after first render that includes them
      freshIds.current.clear();
    });
    return unsub;
  }, [user.uid]);

  const handleSignOut = () => signOut(auth);

  const addTask = async () => {
    const v = draft.trim();
    if (!v) return;
    setDraft('');
    setComposerOpen(false);
    const ref = await addDoc(collection(db, 'users', user.uid, 'tasks'), {
      title: v,
      done: false,
      createdAt: serverTimestamp(),
    });
    freshIds.current.add(ref.id);
  };

  const toggleTask = (task) => {
    const ref = doc(db, 'users', user.uid, 'tasks', task.id);
    updateDoc(ref, { done: !task.done });
  };

  const startEdit = (task) => {
    setEditingId(task.id);
    setEditDraft(task.title);
  };

  const commitEdit = () => {
    const v = editDraft.trim();
    if (v && editingId) {
      const ref = doc(db, 'users', user.uid, 'tasks', editingId);
      updateDoc(ref, { title: v });
    }
    setEditingId(null);
  };

  const cancelEdit = () => setEditingId(null);

  const removeTask = (task) => {
    const ref = doc(db, 'users', user.uid, 'tasks', task.id);
    deleteDoc(ref);
    setUndo({ task, docData: { title: task.title, done: task.done, createdAt: task.createdAt } });
    clearTimeout(undoTimer.current);
    undoTimer.current = setTimeout(() => setUndo(null), 4200);
  };

  const doUndo = async () => {
    if (!undo) return;
    clearTimeout(undoTimer.current);
    const ref = await addDoc(collection(db, 'users', user.uid, 'tasks'), {
      title: undo.docData.title,
      done: undo.docData.done,
      createdAt: undo.docData.createdAt || serverTimestamp(),
    });
    freshIds.current.add(ref.id);
    setUndo(null);
  };

  const openTasks = tasks.filter(x => !x.done);
  const doneTasks = tasks.filter(x => x.done);
  const total = tasks.length;
  const doneCount = doneTasks.length;

  return (
    <div style={{
      minHeight: '100vh', background: t.bg, color: t.ink,
      fontFamily: t.body, display: 'flex', flexDirection: 'column',
      position: 'relative', overflow: 'hidden',
    }}>
      <Header doneCount={doneCount} total={total} onSignOut={handleSignOut} />

      {/* scrollable task list */}
      <div
        className="ft-scroll"
        style={{ flex: 1, overflowY: 'auto', padding: '6px 18px 120px' }}
      >
        {openTasks.length > 0 && (
          <GroupLabel text="To do" count={openTasks.length} />
        )}
        {openTasks.map(task => (
          <TaskRow
            key={task.id}
            task={task}
            editing={editingId === task.id}
            editDraft={editDraft}
            setEditDraft={setEditDraft}
            onToggle={() => toggleTask(task)}
            onStartEdit={() => startEdit(task)}
            onCommit={commitEdit}
            onCancel={cancelEdit}
            onDelete={() => removeTask(task)}
          />
        ))}

        {openTasks.length === 0 && (
          <EmptyState onAdd={() => setComposerOpen(true)} />
        )}

        {doneTasks.length > 0 && (
          <>
            <GroupLabel text="Done" count={doneTasks.length} dim />
            {doneTasks.map(task => (
              <TaskRow
                key={task.id}
                task={task}
                editing={editingId === task.id}
                editDraft={editDraft}
                setEditDraft={setEditDraft}
                onToggle={() => toggleTask(task)}
                onStartEdit={() => startEdit(task)}
                onCommit={commitEdit}
                onCancel={cancelEdit}
                onDelete={() => removeTask(task)}
              />
            ))}
          </>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => setComposerOpen(true)}
        className="ft-press"
        title="New task"
        style={{
          position: 'absolute', right: 20, bottom: 30, zIndex: 30,
          width: 60, height: 60, borderRadius: '50%',
          border: 'none', background: t.rust, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 12px 26px rgba(166,66,30,0.45)',
        }}
      ><Plus s={26} /></button>

      {/* undo toast */}
      {undo && (
        <div
          className="ft-toast"
          style={{
            position: 'absolute', left: 18, right: 18, bottom: 30, zIndex: 40,
            height: 52, borderRadius: 14, background: t.ink, color: t.surface,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 8px 0 18px', fontSize: 14.5, fontFamily: t.body,
            boxShadow: '0 14px 30px rgba(0,0,0,0.25)',
          }}
        >
          <span>Task deleted</span>
          <button
            onClick={doUndo}
            style={{
              border: 'none', background: 'transparent', color: t.amber,
              fontWeight: 700, fontSize: 14.5, padding: '10px 14px',
              cursor: 'pointer', fontFamily: t.body, letterSpacing: 0.3,
            }}
          >UNDO</button>
        </div>
      )}

      {/* composer sheet */}
      {composerOpen && (
        <ComposerSheet
          draft={draft}
          setDraft={setDraft}
          onAdd={addTask}
          onClose={() => setComposerOpen(false)}
        />
      )}
    </div>
  );
}
