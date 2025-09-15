'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getUserPreferences, hasUserCompletedOnboarding } from '@/lib/userPreferences'

export default function Debug() {
  const { user, loading } = useAuth()
  const [preferences, setPreferences] = useState<object | null>(null)
  const [onboardingStatus, setOnboardingStatus] = useState<boolean | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const checkStatus = async () => {
      if (user) {
        try {
          console.log('Debug - User ID:', user.id)
          const prefs = await getUserPreferences(user.id)
          console.log('Debug - Preferences:', prefs)
          setPreferences(prefs)
          
          const onboarding = await hasUserCompletedOnboarding(user.id)
          console.log('Debug - Onboarding completed:', onboarding)
          setOnboardingStatus(onboarding)
        } catch (err) {
          console.error('Debug - Error:', err)
          setError(err instanceof Error ? err.message : 'Unknown error')
        }
      }
    }

    checkStatus()
  }, [user])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)' }}>
        <div className="text-center">
          <div className="text-xl mb-4" style={{ color: 'var(--foreground)' }}>Loading...</div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto" style={{ borderColor: 'var(--accent)' }}></div>
        </div>
      </div>
    )
  }

  if (!user) {
    return <div>Please sign in to debug</div>
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Debug Information</h1>
      
      <div className="space-y-4">
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-semibold">User Information</h2>
          <p>User ID: {user.id}</p>
          <p>Email: {user.email}</p>
        </div>

        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-semibold">Preferences</h2>
          <pre className="text-sm">{JSON.stringify(preferences, null, 2)}</pre>
        </div>

        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-semibold">Onboarding Status</h2>
          <p>Completed: {onboardingStatus === null ? 'Loading...' : onboardingStatus ? 'Yes' : 'No'}</p>
        </div>

        {error && (
          <div className="bg-red-100 p-4 rounded">
            <h2 className="font-semibold text-red-800">Error</h2>
            <p className="text-red-600">{error}</p>
          </div>
        )}
      </div>
    </div>
  )
}
