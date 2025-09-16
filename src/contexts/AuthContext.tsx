'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase'

interface UserRole {
  role: 'reader' | 'publisher'
}

interface AuthContextType {
  user: User | null
  userRole: UserRole | null
  loading: boolean
  error: string | null
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, metadata?: { firstName?: string; lastName?: string; role?: 'reader' | 'publisher' }) => Promise<void>
  signOut: () => Promise<void>
  isPublisher: () => boolean
  debugUserRole: () => Promise<void>
  clearError: () => void
  clearAuthData: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userRole, setUserRole] = useState<UserRole | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  // Function to clear all auth data and force a clean state
  const clearAuthData = useCallback(async () => {
    try {
      // Clear Supabase session
      await supabase.auth.signOut()
      
      // Clear any cached auth data from localStorage
      const keysToRemove = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && (key.includes('supabase') || key.includes('auth'))) {
          keysToRemove.push(key)
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key))
      
      // Reset state
      setUser(null)
      setUserRole(null)
      setError(null)
      setLoading(false)
      
      console.log('Auth data cleared successfully')
    } catch (error) {
      console.error('Error clearing auth data:', error)
    }
  }, [supabase])

  // Function to validate session with timeout
  const validateSession = useCallback(async (session: Session | null): Promise<boolean> => {
    if (!session) return false
    
    try {
      // Check if session is expired
      const now = Math.floor(Date.now() / 1000)
      if (session.expires_at && session.expires_at < now) {
        console.log('Session expired, signing out')
        await supabase.auth.signOut()
        return false
      }
      
      // Verify session is still valid by making a test request with timeout
      const validationPromise = supabase.auth.getUser()
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Session validation timeout')), 10000)
      )
      
      const { error } = await Promise.race([validationPromise, timeoutPromise]) as any
      
      if (error) {
        // Handle specific refresh token errors
        if (error.message.includes('Invalid Refresh Token') || 
            error.message.includes('Refresh Token Not Found') ||
            error.message.includes('refresh_token_not_found')) {
          console.log('Refresh token invalid, clearing session:', error.message)
          // Clear the session completely
          await supabase.auth.signOut()
          return false
        }
        console.log('Session invalid, signing out:', error.message)
        await supabase.auth.signOut()
        return false
      }
      
      return true
    } catch (error) {
      console.error('Error validating session:', error)
      
      // Handle timeout errors
      if (error instanceof Error && error.message.includes('timeout')) {
        console.log('Session validation timed out, clearing session')
        setError('Connection timeout. Please sign in again.')
        await clearAuthData()
        return false
      }
      
      // If it's a refresh token error, clear the session
      if (error instanceof Error && 
          (error.message.includes('Invalid Refresh Token') || 
           error.message.includes('Refresh Token Not Found'))) {
        console.log('Refresh token error, clearing session')
        await supabase.auth.signOut()
      }
      return false
    }
  }, [supabase, clearAuthData])

  // Function to fetch user role with retry logic and better error handling
  const fetchUserRole = useCallback(async (userId: string, retries = 3): Promise<UserRole | null> => {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId)
          .single()

        if (error) {
          // If no role found, create a default reader role
          if (error.code === 'PGRST116') {
            console.log(`No user role found (attempt ${attempt}), creating default reader role`)
            const { error: insertError } = await supabase
              .from('user_roles')
              .insert({
                user_id: userId,
                role: 'reader'
              })
            
            if (insertError) {
              console.error('Error creating default user role:', insertError)
              if (attempt === retries) {
                setError('Failed to create user role. Please try signing in again.')
                return null
              }
              continue
            }
            
            return { role: 'reader' }
          }
          
          console.error(`Error fetching user role (attempt ${attempt}):`, error)
          if (attempt === retries) {
            setError('Failed to load user permissions. Please try refreshing the page.')
            return null
          }
          continue
        }

        return data
      } catch (error) {
        console.error(`Error fetching user role (attempt ${attempt}):`, error)
        if (attempt === retries) {
          setError('Network error loading user permissions. Please check your connection.')
          return null
        }
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 500 * attempt))
      }
    }
    return null
  }, [supabase])

  // Function to handle auth state changes with proper error handling
  const handleAuthStateChange = useCallback(async (event: string, session: Session | null) => {
    console.log('Auth state change:', event, session?.user?.id)
    
    try {
      setError(null)
      
      if (event === 'SIGNED_OUT' || !session) {
        setUser(null)
        setUserRole(null)
        setLoading(false)
        return
      }

      // Handle specific auth events
      if (event === 'TOKEN_REFRESHED') {
        console.log('Token refreshed successfully')
        setUser(session.user)
        const role = await fetchUserRole(session.user.id)
        setUserRole(role)
        setLoading(false)
        return
      }

      // Validate session before proceeding
      const isValid = await validateSession(session)
      if (!isValid) {
        setUser(null)
        setUserRole(null)
        setLoading(false)
        return
      }

      setUser(session.user)
      
      // Fetch user role
      const role = await fetchUserRole(session.user.id)
      setUserRole(role)
      
    } catch (error) {
      console.error('Error handling auth state change:', error)
      
      // Handle specific refresh token errors
      if (error instanceof Error && 
          (error.message.includes('Invalid Refresh Token') || 
           error.message.includes('Refresh Token Not Found') ||
           error.message.includes('refresh_token_not_found'))) {
        console.log('Refresh token error detected, clearing session')
        setError('Your session has expired. Please sign in again.')
        setUser(null)
        setUserRole(null)
        // Force sign out to clear any invalid tokens
        try {
          await supabase.auth.signOut()
        } catch (signOutError) {
          console.error('Error during forced sign out:', signOutError)
        }
      } else {
        setError('Authentication error. Please try signing in again.')
        setUser(null)
        setUserRole(null)
      }
    } finally {
      setLoading(false)
    }
  }, [validateSession, fetchUserRole, supabase])

  useEffect(() => {
    let mounted = true

    // Get initial session
    const initializeAuth = async () => {
      try {
        setError(null)
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error getting initial session:', error)
          
          // Handle specific refresh token errors during initial load
          if (error.message.includes('Invalid Refresh Token') || 
              error.message.includes('Refresh Token Not Found') ||
              error.message.includes('refresh_token_not_found')) {
            console.log('Refresh token invalid during initial load, clearing session')
            setError('Your session has expired. Please sign in again.')
            // Clear auth data completely
            await clearAuthData()
          } else {
            setError('Failed to load session. Please try signing in again.')
          }
          
          if (mounted) {
            setUser(null)
            setUserRole(null)
            setLoading(false)
          }
          return
        }

        // If no session, set loading to false immediately
        if (!session) {
          if (mounted) {
            setUser(null)
            setUserRole(null)
            setLoading(false)
          }
          return
        }

        await handleAuthStateChange('INITIAL_SESSION', session)
      } catch (error) {
        console.error('Error initializing auth:', error)
        
        // Handle refresh token errors in catch block too
        if (error instanceof Error && 
            (error.message.includes('Invalid Refresh Token') || 
             error.message.includes('Refresh Token Not Found'))) {
          console.log('Refresh token error during initialization, clearing session')
          setError('Your session has expired. Please sign in again.')
          await clearAuthData()
        } else {
          setError('Failed to initialize authentication. Please refresh the page.')
        }
        
        if (mounted) {
          setUser(null)
          setUserRole(null)
          setLoading(false)
        }
      }
    }

    initializeAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange)

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [supabase.auth, handleAuthStateChange, clearAuthData])

  const signIn = async (email: string, password: string) => {
    try {
      setError(null)
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) {
        setError(error.message)
        throw error
      }
    } catch (error) {
      console.error('Sign in error:', error)
      throw error
    }
  }

  const signUp = async (email: string, password: string, metadata?: { firstName?: string; lastName?: string; role?: 'reader' | 'publisher' }) => {
    try {
      setError(null)
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: metadata?.firstName,
            last_name: metadata?.lastName,
          },
        },
      })
      if (error) {
        setError(error.message)
        throw error
      }

      // If signup successful, create user role (default to reader if not specified)
      if (data.user) {
        const role = metadata?.role || 'reader'
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: data.user.id,
            role: role
          })

        if (roleError) {
          console.error('Error creating user role:', roleError)
          setError('Account created but failed to set permissions. Please contact support.')
          // Don't throw error here as user is already created
          // The fetchUserRole function will handle creating a default role
        } else {
          console.log(`User role '${role}' created successfully for user ${data.user.id}`)
        }
      }
    } catch (error) {
      console.error('Sign up error:', error)
      throw error
    }
  }

  const signOut = async () => {
    try {
      setError(null)
      const { error } = await supabase.auth.signOut()
      if (error) {
        setError(error.message)
        throw error
      }
    } catch (error) {
      console.error('Sign out error:', error)
      // Force clear local state even if signout fails
      setUser(null)
      setUserRole(null)
      setLoading(false)
      throw error
    }
  }

  const isPublisher = () => {
    return userRole?.role === 'publisher'
  }

  const clearError = () => {
    setError(null)
  }

  // Debug function to check user role status
  const debugUserRole = async () => {
    if (!user) {
      console.log('No user logged in')
      return
    }
    
    console.log('Debugging user role for user:', user.id)
    console.log('Current userRole state:', userRole)
    
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', user.id)
      
      console.log('Direct database query result:', { data, error })
    } catch (error) {
      console.error('Error in debug query:', error)
    }
  }

  const value = {
    user,
    userRole,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    isPublisher,
    debugUserRole,
    clearError,
    clearAuthData,
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
