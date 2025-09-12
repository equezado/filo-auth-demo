'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase'

interface UserRole {
  role: 'reader' | 'publisher'
}

interface AuthContextType {
  user: User | null
  userRole: UserRole | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, metadata?: { firstName?: string; lastName?: string; role?: 'reader' | 'publisher' }) => Promise<void>
  signOut: () => Promise<void>
  isPublisher: () => boolean
  debugUserRole: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userRole, setUserRole] = useState<UserRole | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  // Function to fetch user role with retry logic
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
              if (attempt === retries) return null
              continue
            }
            
            return { role: 'reader' }
          }
          
          console.error(`Error fetching user role (attempt ${attempt}):`, error)
          if (attempt === retries) return null
          continue
        }

        return data
      } catch (error) {
        console.error(`Error fetching user role (attempt ${attempt}):`, error)
        if (attempt === retries) return null
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 500 * attempt))
      }
    }
    return null
  }, [supabase])

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      
      if (session?.user) {
        const role = await fetchUserRole(session.user.id)
        setUserRole(role)
      } else {
        setUserRole(null)
      }
      
      setLoading(false)
    }

    getSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        
        if (session?.user) {
          const role = await fetchUserRole(session.user.id)
          setUserRole(role)
        } else {
          setUserRole(null)
        }
        
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase.auth, fetchUserRole])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
  }

  const signUp = async (email: string, password: string, metadata?: { firstName?: string; lastName?: string; role?: 'reader' | 'publisher' }) => {
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
    if (error) throw error

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
        // Don't throw error here as user is already created
        // The fetchUserRole function will handle creating a default role
      } else {
        console.log(`User role '${role}' created successfully for user ${data.user.id}`)
      }
    }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  const isPublisher = () => {
    return userRole?.role === 'publisher'
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
    signIn,
    signUp,
    signOut,
    isPublisher,
    debugUserRole,
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
