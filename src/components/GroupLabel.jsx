import t from '../theme.js';

export default function GroupLabel({ text, count, dim }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '20px 4px 10px', opacity: dim ? 0.6 : 1,
    }}>
      <span style={{
        fontFamily: t.mono, fontSize: 11.5, letterSpacing: 2,
        textTransform: 'uppercase', color: t.muted, fontWeight: 600,
      }}>{text}</span>
      <span style={{ fontFamily: t.mono, fontSize: 11.5, color: t.muted, opacity: 0.7 }}>{count}</span>
      <div style={{ flex: 1, height: 1, background: t.line }} />
    </div>
  );
}
