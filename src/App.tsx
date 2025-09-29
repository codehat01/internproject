import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Landing from './components/Landing';
import Dashboard from './components/Dashboard';
import ErrorBoundary from './components/ErrorBoundary';
import { getCurrentUserProfile, transformProfileToUser } from './lib/auth';
import { supabase } from './lib/supabase';
import type { User } from './types';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { useAuth } from './hooks/useAuth';
import './index.css';

function App(): React.JSX.Element {
  const [showLanding, setShowLanding] = useState<boolean>(true);
  const [user, setUser] = useState<User | null>(null);

  // use simplified auth hook
  const { sessionUser, loading: sessionLoading, initialized, sessionExpired, clearSessionExpired, signOut } = useAuth() as any;
  // ensure the loading splash remains visible for a short minimum time to avoid flashes
  const [minDelayOver, setMinDelayOver] = useState<boolean>(false);

  // When sessionUser changes, attempt to load profile and set the app user
  useEffect(() => {
    let mounted = true

    const restoreProfile = async () => {
      try {
        if (!sessionUser) {
          // no session -> ensure app user is null
          if (mounted) setUser(null)
          return
        }

        // hide landing immediately for any present session
        if (mounted) setShowLanding(false)

        // attempt to fetch profile
        const profile = await getCurrentUserProfile()
        if (profile && mounted) {
          const u = transformProfileToUser(profile, sessionUser.email)
          setUser(u)
          console.log('App: Restored user from session')
        } else {
          console.warn('App: session present but profile missing; user will stay null until profile is available')
          // still hide landing but show login if desired; keep user null
        }
      } catch (err) {
        console.error('App: Error restoring profile:', err)
      } finally {
        // nothing else needed here; App will render once `initialized` is true
      }
    }

    restoreProfile()

    return () => { mounted = false }
  }, [sessionUser])

  // when auth initialization completes, enforce a short minimum loading duration
  useEffect(() => {
    let t: number | undefined = undefined
    if (initialized) {
      setMinDelayOver(false)
      // keep loader visible at least 350ms after init to avoid flicker
      t = window.setTimeout(() => setMinDelayOver(true), 500)
    } else {
      setMinDelayOver(false)
    }
    return () => { if (t) window.clearTimeout(t) }
  }, [initialized])

  const handleLogin = (userData: User): void => {
    setUser(userData);
  };

  const handleLogout = async (): Promise<void> => {
    try {
      await signOut();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      // Force logout even if there's an error
      setUser(null);
    }
  };

  // Show a nicer loading screen only during initial auth check (wait for auth initialized)
  if (!initialized || sessionLoading || !minDelayOver) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'linear-gradient(180deg, #F6FBFF 0%, #EEF6FF 100%)'
      }}>
        <div style={{
          width: 420,
          padding: '28px 28px',
          borderRadius: 12,
          boxShadow: '0 20px 40px rgba(16,24,40,0.08)',
          background: 'white',
          display: 'flex',
          gap: 18,
          alignItems: 'center'
        }}>
          <div style={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            background: 'linear-gradient(180deg, #E6F0FF 0%, #DCEBFF 100%)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            boxShadow: 'inset 0 -6px 12px rgba(0,0,0,0.03)'
          }}>
            <div style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              border: '4px solid #2B6CB0',
              borderTopColor: 'transparent',
              animation: 'spin 1s linear infinite'
            }} />
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ height: 18, width: '60%', background: '#F1F8FF', borderRadius: 8, marginBottom: 8 }} />
            <div style={{ height: 12, width: '40%', background: '#F1F8FF', borderRadius: 6, marginBottom: 16 }} />
            <div style={{ color: '#1F2937', fontWeight: 700, fontSize: 16 }}>Preparing your dashboard</div>
            <div style={{ color: '#6B7280', fontSize: 13, marginTop: 6 }}>Checking session and loading your profile...</div>
          </div>

        <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
        </div>
      </div>
    );
  }
  // If landing hasn't been dismissed yet and there is no authenticated user, show it
  if (showLanding && !user) {
    return <Landing onEnter={() => setShowLanding(false)} />
  }
  // session expiry modal handling
  const handleSessionExpired = () => {
    // clear flag and force a reload to show login
    clearSessionExpired()
    // reload page to show login
    window.location.reload()
  }

  return (
    <ErrorBoundary>
      <div className="App">
        {sessionExpired && (
          <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000, background: 'rgba(0,0,0,0.4)' }}>
            <div style={{ background: 'white', padding: 24, borderRadius: 12, maxWidth: 520, width: '90%', textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Session expired</div>
              <div style={{ color: '#6b7280', marginBottom: 16 }}>Your session has ended. Please log in again to continue.</div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                <button onClick={handleSessionExpired} className="btn btn-primary">Log in</button>
              </div>
            </div>
          </div>
        )}
        {!user ? (
          <Login onLogin={handleLogin} />
        ) : (
          <Dashboard user={user} onLogout={handleLogout} />
        )}
      </div>
    </ErrorBoundary>
  );
}

export default App;