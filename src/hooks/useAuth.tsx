import { useState, useEffect, createContext, useContext } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase, Profile } from '../lib/supabase'
import toast from 'react-hot-toast'

interface AuthContextType {
  user: User | null
  profile: Profile | null
  loading: boolean
  signIn: (badgeNumber: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
  signUp: (badgeNumber: string, password: string, profileData: Partial<Profile>) => Promise<{ error: any }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      
      if (session?.user) {
        await fetchProfile(session.user.id)
      }
      
      setLoading(false)
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setLoading(true)
        setUser(session?.user ?? null)
        
        if (session?.user) {
          await fetchProfile(session.user.id)
        } else {
          setProfile(null)
        }
        
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error
      setProfile(data)
    } catch (error) {
      console.error('Error fetching profile:', error)
      setProfile(null)
      toast.error('Failed to load profile')
    }
  }

  const signIn = async (badgeNumber: string, password: string) => {
    try {
      // Use RPC function to get email by badge number
      const { data: email, error: emailError } = await supabase
        .rpc('get_email_by_badge', { badge_num: badgeNumber })

      if (emailError || !email) {
        return { error: { message: 'Invalid badge number' } }
      }

      // Sign in with email and password
      const { error } = await supabase.auth.signInWithPassword({
        email: email,
        password
      })
      
      return { error }
    } catch (error: any) {
      return { error: { message: 'Authentication failed' } }
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setProfile(null)
  }

  const signUp = async (badgeNumber: string, password: string, profileData: Partial<Profile>) => {
    // Generate email from badge number for internal use
    const email = `${badgeNumber}@police.internal`
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    })

    if (error) return { error }

    if (data.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([
          {
            id: data.user.id,
            badge_number: badgeNumber,
            ...profileData
          }
        ])

      if (profileError) return { error: profileError }
    }

    return { error: null }
  }

  const value = {
    user,
    profile,
    loading,
    signIn,
    signOut,
    signUp
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}