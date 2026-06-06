import { useRef, useEffect } from 'react';
import t from '../theme.js';

export default function ComposerSheet({ draft, setDraft, onAdd, onClose }) {
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, []);

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 50 }}>
      <div
        onClick={onClose}
        className="ft-fade"
        style={{ position: 'absolute', inset: 0, background: 'rgba(30,18,8,0.34)' }}
      />
      <div
        className="ft-sheet"
        style={{
          position: 'absolute', left: 0, right: 0, bottom: 0,
          background: t.surface, borderTopLeftRadius: 26, borderTopRightRadius: 26,
          padding: '14px 18px 26px',
          boxShadow: '0 -10px 40px rgba(0,0,0,0.18)',
        }}
      >
        <div style={{
          width: 40, height: 5, borderRadius: 3,
          background: t.line, margin: '0 auto 16px',
        }} />
        <div style={{
          fontFamily: t.serif, fontSize: 22,
          fontWeight: t.serifWeight, marginBottom: 12,
        }}>New task</div>
        <input
          ref={inputRef}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') onAdd(); }}
          placeholder="What needs doing?"
          style={{
            width: '100%', height: 52, borderRadius: 13,
            border: '1.5px solid ' + t.line, background: t.surfaceAlt,
            padding: '0 16px', fontSize: 16.5,
            fontFamily: t.body, color: t.ink, outline: 'none',
          }}
        />
        <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
          <button
            onClick={onClose}
            className="ft-press"
            style={{
              flex: 1, height: 50, borderRadius: 13,
              border: '1.5px solid ' + t.line,
              background: 'transparent', color: t.muted,
              fontSize: 16, fontWeight: 600,
              fontFamily: t.body, cursor: 'pointer',
            }}
          >Cancel</button>
          <button
            onClick={onAdd}
            className="ft-press"
            style={{
              flex: 2, height: 50, borderRadius: 13,
              border: 'none', background: t.rust, color: '#fff',
              fontSize: 16, fontWeight: 700,
              fontFamily: t.body, cursor: 'pointer',
              opacity: draft.trim() ? 1 : 0.5,
            }}
          >Add task</button>
        </div>
      </div>
    </div>
  );
}
