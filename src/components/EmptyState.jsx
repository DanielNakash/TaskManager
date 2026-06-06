import t from '../theme.js';

export default function EmptyState({ onAdd }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      textAlign: 'center', padding: '40px 30px',
    }}>
      <div style={{ fontSize: 50, transform: 'rotate(-6deg)' }}>🦊</div>
      <div style={{
        fontFamily: t.serif, fontSize: 22,
        fontWeight: t.serifWeight, marginTop: 10,
      }}>
        Inbox zero, fox style.
      </div>
      <p style={{
        color: t.muted, fontSize: 15, lineHeight: 1.5,
        margin: '6px 0 18px', maxWidth: 230,
      }}>
        Nothing left to do. Add the next thing before you forget it.
      </p>
      <button
        onClick={onAdd}
        className="ft-press"
        style={{
          height: 46, padding: '0 22px', borderRadius: 13, border: 'none',
          background: t.rust, color: '#fff', fontSize: 15.5, fontWeight: 700,
          fontFamily: t.body, cursor: 'pointer',
        }}
      >+ New task</button>
    </div>
  );
}
