import { useState } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebase.js';
import { GoogleG } from './icons.jsx';
import t from '../theme.js';

export default function SignIn() {
  const [signing, setSigning] = useState(false);
  const [error, setError] = useState(null);

  const signIn = async () => {
    setSigning(true);
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
      // onAuthStateChanged in App.jsx handles the transition
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError('Sign-in failed. Please try again.');
      }
      setSigning(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', background: t.bg, color: t.ink,
      fontFamily: t.body, display: 'flex', flexDirection: 'column',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* warm wash blobs */}
      <div style={{
        position: 'absolute', top: -120, right: -90, width: 320, height: 320,
        borderRadius: '50%', background: t.amber, opacity: 0.16, filter: 'blur(8px)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: -140, left: -100, width: 300, height: 300,
        borderRadius: '50%', background: t.rust, opacity: 0.12, filter: 'blur(6px)',
        pointerEvents: 'none',
      }} />

      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '0 40px', textAlign: 'center', position: 'relative', zIndex: 2,
      }}>
        <div style={{
          width: 104, height: 104, borderRadius: '50%',
          background: t.surface, border: '2px solid ' + t.rust,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 54, boxShadow: '0 16px 30px rgba(120,60,20,0.18)',
          transform: 'rotate(-4deg)',
        }}>🦊</div>

        <div style={{
          marginTop: 16, fontFamily: t.mono, fontSize: 12, letterSpacing: 4,
          color: t.rust, fontWeight: 600, whiteSpace: 'nowrap',
        }}>DON'T PANIC</div>

        <h1 style={{
          margin: '12px 0 0', fontFamily: t.serif, whiteSpace: 'nowrap',
          fontSize: 37, fontWeight: t.serifWeight, lineHeight: 1.1, letterSpacing: -0.2,
        }}>The Fox Works</h1>

        <p style={{
          margin: '16px 0 0', fontSize: 16, lineHeight: 1.5,
          color: t.muted, maxWidth: 264,
        }}>Your quiet little burrow for everything you mean to get done.</p>

        <button
          onClick={signIn}
          disabled={signing}
          className="ft-press"
          style={{
            marginTop: 34, width: '100%', maxWidth: 300, height: 56,
            borderRadius: 14, border: '1px solid ' + t.line,
            background: t.surface, color: t.ink, cursor: signing ? 'default' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
            fontFamily: t.body, fontSize: 16.5, fontWeight: 600,
            boxShadow: '0 8px 20px rgba(120,60,20,0.10)',
          }}
        >
          {signing ? (
            <span className="ft-spin" style={{
              width: 20, height: 20, borderRadius: '50%',
              border: '2.5px solid ' + t.line, borderTopColor: t.rust,
              display: 'inline-block',
            }} />
          ) : (
            <GoogleG s={20} />
          )}
          <span style={{ whiteSpace: 'nowrap' }}>
            {signing ? 'Signing in…' : 'Continue with Google'}
          </span>
        </button>

        {error && (
          <p style={{ marginTop: 14, fontSize: 13, color: t.rust }}>{error}</p>
        )}

        <p style={{ margin: '20px 0 0', fontSize: 12.5, color: t.muted, maxWidth: 250, lineHeight: 1.5 }}>
          Sign in to see your tasks. They're yours alone — fenced off behind your account.
        </p>
      </div>

      <div style={{
        padding: '0 0 30px', textAlign: 'center',
        fontFamily: t.mono, fontSize: 11, letterSpacing: 1, color: t.muted, opacity: 0.7,
      }}>🔒 SECURED OVER HTTPS</div>
    </div>
  );
}
