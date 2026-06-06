import { useRef, useEffect } from 'react';
import { Check, XMark, Trash } from './icons.jsx';
import t from '../theme.js';

function hexA(hex, a) {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

export default function TaskRow({
  task, editing, editDraft, setEditDraft,
  onToggle, onStartEdit, onCommit, onCancel, onDelete,
}) {
  const editRef = useRef(null);

  useEffect(() => {
    if (editing && editRef.current) {
      editRef.current.focus();
      editRef.current.select();
    }
  }, [editing]);

  const checkbox = (
    <button
      onClick={onToggle}
      className="ft-press"
      style={{
        position: 'relative', flexShrink: 0, cursor: 'pointer',
        border: 'none', background: 'transparent', padding: 0,
        width: 28, height: 28,
      }}
    >
      <span style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: '100%', height: '100%',
        borderRadius: 6,
        border: '2px solid ' + (task.done ? t.rust : hexA(t.ink, 0.28)),
        background: task.done ? t.rust : 'transparent',
        transition: 'background .18s, border-color .18s',
      }}>
        {task.done && <Check s={16} />}
      </span>
    </button>
  );

  const titleEl = editing ? (
    <input
      ref={editRef}
      value={editDraft}
      onChange={e => setEditDraft(e.target.value)}
      onBlur={onCommit}
      onKeyDown={e => {
        if (e.key === 'Enter') onCommit();
        if (e.key === 'Escape') { e.preventDefault(); onCancel(); }
      }}
      style={{
        flex: 1, minWidth: 0, border: 'none',
        borderBottom: '2px solid ' + t.rust,
        background: 'transparent', fontSize: 16.5,
        fontFamily: t.body, color: t.ink,
        padding: '2px 0', outline: 'none',
      }}
    />
  ) : (
    <span
      onClick={onStartEdit}
      style={{
        flex: 1, minWidth: 0, fontSize: 16.5, lineHeight: 1.35,
        cursor: 'text', color: task.done ? t.muted : t.ink,
        textDecoration: task.done ? 'line-through' : 'none',
        textDecorationColor: hexA(t.rust, 0.6),
        transition: 'color .2s',
      }}
    >{task.title}</span>
  );

  const editActions = (
    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
      <button
        onPointerDown={e => e.preventDefault()}
        onClick={onCancel}
        className="ft-press"
        title="Cancel"
        style={{
          width: 33, height: 33, borderRadius: 9,
          border: '1px solid ' + t.line, background: 'transparent',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      ><XMark s={15} c={t.muted} /></button>
      <button
        onPointerDown={e => e.preventDefault()}
        onClick={onCommit}
        className="ft-press"
        title="Save"
        style={{
          width: 33, height: 33, borderRadius: 9,
          border: 'none', background: t.rust, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      ><Check s={16} c="#fff" w={3} /></button>
    </div>
  );

  return (
    <div
      className={task.fresh ? 'ft-pop-in' : ''}
      style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '16px 4px', borderBottom: '1px solid ' + t.line,
        position: 'relative', opacity: task.done ? 0.62 : 1,
      }}
    >
      {checkbox}
      {titleEl}
      {editing ? editActions : (
        <>
          {task.done && (
            <span style={{
              fontFamily: t.mono, fontSize: 9, fontWeight: 700, letterSpacing: 1,
              color: t.rust, border: '1.5px solid ' + t.rust, borderRadius: 3,
              padding: '2px 5px', transform: 'rotate(-7deg)', flexShrink: 0,
            }}>DONE</span>
          )}
          <button
            onClick={onDelete}
            className="ft-rowdel ft-press"
            title="Delete"
            style={{
              flexShrink: 0, width: 30, height: 30, borderRadius: 9,
              border: 'none', background: 'transparent', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          ><Trash s={17} c={hexA(t.ink, 0.32)} /></button>
        </>
      )}
    </div>
  );
}
