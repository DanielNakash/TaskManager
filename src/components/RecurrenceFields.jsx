// RecurrenceFields.jsx — small controls + the reusable recurrence pattern builder.
// Ported from the v1.1.0 design prototype (recurrence.jsx).
import t from '../theme.js';
import { ordinal, WD, WD_FULL } from '../utils/dates.js';

export function Stepper({ value, set, min = 1, max = 99 }) {
  const btn = (lbl, fn, dis) => (
    <button onClick={fn} disabled={dis} className="ft-press" style={{
      width: 38, height: 38, border: 'none', background: 'transparent', cursor: dis ? 'default' : 'pointer',
      color: dis ? t.faint : t.rust, fontSize: 22, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>{lbl}</button>
  );
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', background: t.card, border: '1px solid ' + t.line, borderRadius: 11, overflow: 'hidden' }}>
      {btn('–', () => set(Math.max(min, value - 1)), value <= min)}
      <div style={{ minWidth: 30, textAlign: 'center', fontFamily: t.mono, fontSize: 16, fontWeight: 600 }}>{value}</div>
      {btn('+', () => set(Math.min(max, value + 1)), value >= max)}
    </div>
  );
}

export function Segmented({ options, value, set, small }) {
  return (
    <div style={{ display: 'flex', background: t.surfaceAlt, border: '1px solid ' + t.line, borderRadius: 12, padding: 3, gap: 3 }}>
      {options.map(o => {
        const on = o.v === value;
        return (
          <button key={o.v} onClick={() => set(o.v)} className="ft-press" style={{
            flex: 1, border: 'none', cursor: 'pointer', borderRadius: 9, padding: small ? '8px 4px' : '10px 6px',
            background: on ? t.rust : 'transparent', color: on ? '#fff' : t.muted,
            fontFamily: t.body, fontSize: small ? 13 : 14, fontWeight: on ? 700 : 500, whiteSpace: 'nowrap',
          }}>{o.label}</button>
        );
      })}
    </div>
  );
}

export function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontFamily: t.mono, fontSize: 10.5, letterSpacing: 1.2, textTransform: 'uppercase', color: t.faint, marginBottom: 8 }}>{label}</div>
      {children}
    </div>
  );
}

// pattern fields only (no end date) — reused for the To Do rule and the Due rule
export function RecurrenceFields({ rule, onChange }) {
  const up = (patch) => onChange({ ...rule, ...patch });
  const ord = [{ v: 1, label: 'First' }, { v: 2, label: 'Second' }, { v: 3, label: 'Third' }, { v: 4, label: 'Fourth' }, { v: -1, label: 'Last' }];

  return (
    <div>
      <Field label="Pattern">
        <Segmented value={rule.pattern} set={(v) => up({ pattern: v })} options={[
          { v: 'interval', label: 'Interval' }, { v: 'weekday', label: 'Weekdays' }, { v: 'monthday', label: 'Monthly' },
        ]} />
      </Field>

      {rule.pattern === 'interval' && (
        <Field label="Repeat every">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Stepper value={rule.interval} set={(v) => up({ interval: v })} />
            <div style={{ flex: 1 }}>
              <Segmented value={rule.unit} set={(v) => up({ unit: v })} options={[
                { v: 'day', label: 'Days' }, { v: 'week', label: 'Weeks' }, { v: 'month', label: 'Months' },
              ]} />
            </div>
          </div>
        </Field>
      )}

      {rule.pattern === 'weekday' && (
        <>
          <Field label="On these days">
            <div style={{ display: 'flex', gap: 6 }}>
              {WD.map((d, i) => {
                const on = rule.weekdays.includes(i);
                return (
                  <button key={i} onClick={() => up({ weekdays: on ? rule.weekdays.filter(x => x !== i) : [...rule.weekdays, i] })}
                    className="ft-press" style={{
                      flex: 1, aspectRatio: '1', borderRadius: '50%', cursor: 'pointer',
                      border: '1.5px solid ' + (on ? t.rust : t.line), background: on ? t.rust : 'transparent',
                      color: on ? '#fff' : t.muted, fontFamily: t.body, fontSize: 12.5, fontWeight: on ? 700 : 500,
                    }}>{d[0]}</button>
                );
              })}
            </div>
          </Field>
          <Field label="Frequency">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 15, color: t.muted }}>Every</span>
              <Stepper value={rule.weekInterval} set={(v) => up({ weekInterval: v })} />
              <span style={{ fontSize: 15, color: t.muted }}>{rule.weekInterval === 1 ? 'week' : 'weeks'}</span>
            </div>
          </Field>
        </>
      )}

      {rule.pattern === 'monthday' && (
        <>
          <Field label="On">
            <Segmented value={rule.monthMode} set={(v) => up({ monthMode: v })} options={[
              { v: 'date', label: 'A date' }, { v: 'weekday', label: 'A weekday' },
            ]} />
          </Field>
          {rule.monthMode === 'date' ? (
            <Field label="Day of month">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 15, color: t.muted }}>The</span>
                <Stepper value={rule.monthDate} set={(v) => up({ monthDate: v })} min={1} max={31} />
                <span style={{ fontSize: 15, color: t.muted }}>{ordinal(rule.monthDate).replace(/^\d+/, '')}</span>
              </div>
            </Field>
          ) : (
            <Field label="Which weekday">
              <div style={{ display: 'flex', gap: 8 }}>
                <select value={rule.monthWeekPos} onChange={e => up({ monthWeekPos: Number(e.target.value) })} style={selStyle()}>
                  {ord.map(o => <option key={o.v} value={o.v}>{o.label}</option>)}
                </select>
                <select value={rule.monthWeekday} onChange={e => up({ monthWeekday: Number(e.target.value) })} style={selStyle()}>
                  {WD_FULL.map((d, i) => <option key={i} value={i}>{d}</option>)}
                </select>
              </div>
            </Field>
          )}
          <Field label="Frequency">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 15, color: t.muted }}>Every</span>
              <Stepper value={rule.monthInterval} set={(v) => up({ monthInterval: v })} />
              <span style={{ fontSize: 15, color: t.muted }}>{rule.monthInterval === 1 ? 'month' : 'months'}</span>
            </div>
          </Field>
        </>
      )}
    </div>
  );
}

export function selStyle() {
  return { flex: 1, height: 46, borderRadius: 11, border: '1px solid ' + t.line, background: t.card,
    padding: '0 12px', fontSize: 15, fontFamily: t.body, color: t.ink, cursor: 'pointer', appearance: 'none', WebkitAppearance: 'none' };
}
