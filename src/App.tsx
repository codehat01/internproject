import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Landing from './components/Landing';
import Dashboard from './components/Dashboard';
import ErrorBoundary from './components/ErrorBoundary';
import { getCurrentUserProfile, logout, transformProfileToUser } from './lib/auth';
import { supabase } from './lib/supabase';
import type { User } from './types';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import './index.css';

function App(): React.JSX.Element {
  const [showLanding, setShowLanding] = useState<boolean>(true);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [authChecked, setAuthChecked] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    let checkTimeout: NodeJS.Timeout;
    
    console.log('App: Setting up auth listener...');

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        console.log('App: Auth state changed:', event, session ? 'Has session' : 'No session');

        if (!isMounted) return;

        try {
          // Handle signed in and token refreshed events
          if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session) {
            console.log('App: Getting user profile after sign-in/refresh...');
            const profile = await getCurrentUserProfile();

            if (profile && isMounted) {
              const userData = transformProfileToUser(profile, session.user?.email);
              setUser(userData);
              console.log('App: User set successfully (auth listener)');
            } else {
              console.log('App: Profile missing after auth event');
            }
          } else if (event === 'SIGNED_OUT') {
            setUser(null);
            console.log('App: User logged out');
          }

          // Always set loading to false after auth state change
          if (isMounted) {
            setLoading(false);
            setAuthChecked(true);
          }
        } catch (error) {
          console.error('App: Error in auth listener:', error);
          if (isMounted) {
            setLoading(false);
            setAuthChecked(true);
          }
        }
      }
    );

    // Initial session check with timeout
    const checkInitialSession = async (): Promise<void> => {
      try {
        console.log('App: Checking initial session...');
        // Use getSession which returns the active session if present
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('App: Error getting session:', error);
          if (isMounted) {
            setLoading(false);
            setAuthChecked(true);
          }
          return;
        }

        console.log('App: Initial session:', session ? 'Has session' : 'No session');

        if (session && isMounted) {
          // Ensure we try to restore profile from DB
          const profile = await getCurrentUserProfile();
          if (profile && isMounted) {
            const userData = transformProfileToUser(profile, session.user?.email);
            setUser(userData);
            console.log('App: Initial user set (session present)');
          } else {
            console.log('App: Session exists but profile missing');
          }
        }

        // Always set loading to false after initial check
        if (isMounted) {
          setLoading(false);
          setAuthChecked(true);
        }
      } catch (error) {
        console.error('App: Error checking initial session:', error);
        if (isMounted) {
          setLoading(false);
          setAuthChecked(true);
        }
      }
    };

    // Set a timeout to ensure loading is set to false even if something goes wrong
    checkTimeout = setTimeout(() => {
      if (isMounted && loading) {
        console.log('App: Authentication check timeout, setting loading to false');
        setLoading(false);
        setAuthChecked(true);
      }
    }, 5000); // 5 second timeout

    // Check initial session
    checkInitialSession();

    return () => {
      isMounted = false;
      if (checkTimeout) clearTimeout(checkTimeout);
      console.log('App: Cleaning up');
      subscription.unsubscribe();
    };
  }, []);

  const handleLogin = (userData: User): void => {
    setUser(userData);
  };

  const handleLogout = async (): Promise<void> => {
    try {
      await logout();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      // Force logout even if there's an error
      setUser(null);
    }
  };

  // Show a nicer loading screen only during initial auth check, with a timeout
  if (loading && !authChecked) {
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
  // If landing hasn't been dismissed yet, show it and enter to app
  if (showLanding) {
    return <Landing onEnter={() => setShowLanding(false)} />
  }

  return (
    <ErrorBoundary>
      <div className="App">
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