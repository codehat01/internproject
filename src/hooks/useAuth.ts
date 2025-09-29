import { useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { loginWithBadge } from '../lib/auth'
import { transformProfileToUser } from '../lib/auth'
import type { User as AppUser } from '../types'
import type { User as SupabaseUser } from '@supabase/supabase-js'

export function useAuth() {
  const [sessionUser, setSessionUser] = useState<SupabaseUser | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  // indicates the auth system finished its initial session read and listener setup
  const [initialized, setInitialized] = useState<boolean>(false)
  // session expiry handling
  const [sessionExpired, setSessionExpired] = useState<boolean>(false)
  let expiryTimer: number | null = null
  // used to distinguish manual sign-out from expiry-driven sign-out
  const userInitiatedSignOut = useRef<boolean>(false)

  useEffect(() => {
    let mounted = true
  // hold the unsubscribe function so cleanup can call it safely
  let unsubscribeFn: (() => void) | null = null;

    // initial session check — read session first then install listener so we avoid races
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!mounted) return
        setSessionUser(session?.user ?? null)
        // schedule expiry if session exists
        if (session && session.expires_at) {
          const ms = session.expires_at * 1000 - Date.now()
          if (ms <= 0) {
            // already expired
            try { await supabase.auth.signOut() } catch (e) { /* ignore */ }
            setSessionExpired(true)
          } else {
            expiryTimer = window.setTimeout(async () => {
              // token expired — mark expired and sign out
              setSessionExpired(true)
              try { await supabase.auth.signOut() } catch (e) { /* ignore */ }
            }, ms)
          }
        }
      } catch (err) {
        console.error('useAuth: getSession error', err)
      }

      // listen for auth state changes
  const result = supabase.auth.onAuthStateChange((event: any, session) => {
        if (!mounted) return
        setSessionUser(session?.user ?? null)
        setLoading(false)

        // clear any existing expiry timer
        try { if (expiryTimer) window.clearTimeout(expiryTimer) } catch (e) { /* ignore */ }

        // If session exists, schedule next expiry from session.expires_at
        if (session && session.expires_at) {
          const ms = session.expires_at * 1000 - Date.now()
          if (ms <= 0) {
            // immediate expiry
            setSessionExpired(true)
            supabase.auth.signOut().catch(() => { /* ignore */ })
          } else {
            expiryTimer = window.setTimeout(async () => {
              setSessionExpired(true)
              try { await supabase.auth.signOut() } catch (e) { /* ignore */ }
            }, ms)
          }
        } else {
          // no session -> nothing to schedule
        }

        // If token refresh failed event, mark expired. Ignore user-initiated signed out events
        if (event === 'TOKEN_REFRESH_FAILED') {
          setSessionExpired(true)
        }
        if (event === 'SIGNED_OUT' && !userInitiatedSignOut.current) {
          setSessionExpired(true)
        }
      })
      // the supabase client returns a subscription object with an unsubscribe method
      unsubscribeFn = result?.data?.subscription?.unsubscribe ?? null

      // mark initialization complete once we've read session and installed listener
      if (mounted) {
        setInitialized(true)
        setLoading(false)
      }
    })()

    return () => {
      mounted = false
      try {
        if (unsubscribeFn) unsubscribeFn()
      } catch (e) { /* ignore */ }
      try { if (expiryTimer) window.clearTimeout(expiryTimer) } catch (e) { /* ignore */ }
    }
  }, [])

  // simple wrappers similar to your old project
  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }

  const signOut = async () => {
    // mark that this sign out was initiated by the user so the listener doesn't treat it as expiration
    userInitiatedSignOut.current = true
    // clear any scheduled expiry
    try { if (expiryTimer) window.clearTimeout(expiryTimer) } catch (e) { /* ignore */ }
    const { error } = await supabase.auth.signOut()
    // explicit sign out resets expired flag
    setSessionExpired(false)
    // small delay then clear the userInitiated flag (in case the listener fires after)
    setTimeout(() => { userInitiatedSignOut.current = false }, 50)
    return { error }
  }

  const clearSessionExpired = () => setSessionExpired(false)

  // Sign in by badge (username) -> RPC -> email -> password
  const signInWithBadge = async (badge: string, password: string) => {
    try {
      const { user, profile } = await loginWithBadge(badge, password)
      // transform profile to app user shape (email may come from user)
      const appUser: AppUser | null = profile ? transformProfileToUser(profile, user?.email) : null
      return { error: null, user: appUser, rawUser: user }
    } catch (err: any) {
      return { error: err, user: null, rawUser: null }
    }
  }

  return { sessionUser, loading, initialized, sessionExpired, clearSessionExpired, signIn, signOut, signInWithBadge }
}
