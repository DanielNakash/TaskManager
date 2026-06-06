import t from '../theme.js';

export default function Header({ doneCount, total, onSignOut }) {
  const pct = total ? Math.round((doneCount / total) * 100) : 0;
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'short', day: 'numeric',
  });

  return (
    <div style={{ flexShrink: 0 }}>
      <div style={{
        background: t.rust, color: '#FBF4E6',
        padding: '54px 18px 16px', position: 'relative',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{
            fontFamily: t.mono, fontSize: 11, letterSpacing: 3,
            opacity: 0.85, whiteSpace: 'nowrap',
          }}>DON'T PANIC</span>
          <button
            onClick={onSignOut}
            title="Sign out"
            style={{
              width: 40, height: 40, borderRadius: 12, border: 'none',
              background: 'transparent', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <span style={{ fontSize: 20 }}>🦊</span>
          </button>
        </div>

        <h1 style={{
          margin: '6px 0 0', fontFamily: t.serif,
          fontSize: 38, fontWeight: t.serifWeight,
          letterSpacing: -0.4, lineHeight: 1, color: '#FBF4E6',
        }}>Today</h1>

        <div style={{ marginTop: 14 }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
            fontFamily: t.mono, fontSize: 11.5, letterSpacing: 0.5, opacity: 0.92,
          }}>
            <span style={{ whiteSpace: 'nowrap' }}>{today.toUpperCase()}</span>
            <span style={{ whiteSpace: 'nowrap' }}>{doneCount}/{total} DONE</span>
          </div>
          <div style={{
            marginTop: 8, height: 10, borderRadius: 6,
            background: 'rgba(255,255,255,0.22)', overflow: 'hidden',
          }}>
            <div style={{
              width: pct + '%', height: '100%',
              background: t.amber, borderRadius: 6,
              transition: 'width .45s cubic-bezier(.2,.8,.2,1)',
            }} />
          </div>
        </div>
      </div>
    </div>
  );
}
