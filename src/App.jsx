import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase.js';
import t from './theme.js';
import SignIn from './components/SignIn.jsx';
import TaskApp from './components/TaskApp.jsx';

export default function App() {
  const [authState, setAuthState] = useState('loading'); // 'loading' | 'signin' | 'app'
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        setAuthState('app');
      } else {
        setUser(null);
        setAuthState('signin');
      }
    });
    return unsub;
  }, []);

  if (authState === 'loading') {
    return (
      <div style={{
        minHeight: '100vh', background: t.bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span
          className="ft-spin"
          style={{
            width: 28, height: 28, borderRadius: '50%',
            border: '3px solid rgba(36,26,18,0.12)',
            borderTopColor: t.rust, display: 'inline-block',
          }}
        />
      </div>
    );
  }

  if (authState === 'signin') {
    return <SignIn />;
  }

  return <TaskApp user={user} />;
}
