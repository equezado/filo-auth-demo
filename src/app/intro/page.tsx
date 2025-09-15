'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { hasUserCompletedOnboarding } from '@/lib/userPreferences'

export default function Intro() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [checkingOnboarding, setCheckingOnboarding] = useState(false)
  const [hasCheckedOnboarding, setHasCheckedOnboarding] = useState(false)
  const [onboardingError, setOnboardingError] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/signin')
    }
  }, [user, loading, router])

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (user && !checkingOnboarding && !hasCheckedOnboarding) {
        console.log('Checking onboarding status for user:', user.id)
        setCheckingOnboarding(true)
        
        // Add a timeout to prevent infinite loading
        const timeout = setTimeout(() => {
          console.log('Onboarding check timeout - proceeding to categories')
          setCheckingOnboarding(false)
          setHasCheckedOnboarding(true)
        }, 5000) // 5 second timeout
        
        try {
          const hasCompletedOnboarding = await hasUserCompletedOnboarding(user.id)
          console.log('Onboarding completed:', hasCompletedOnboarding)
          clearTimeout(timeout)
          
          if (hasCompletedOnboarding) {
            // User has already completed onboarding, redirect to feeds
            console.log('Redirecting to feeds...')
            router.push('/feeds')
          }
        } catch (error) {
          console.error('Error checking onboarding status:', error)
          clearTimeout(timeout)
          setOnboardingError(true)
        } finally {
          setCheckingOnboarding(false)
          setHasCheckedOnboarding(true)
        }
      }
    }

    checkOnboardingStatus()
  }, [user, checkingOnboarding, hasCheckedOnboarding, router])

  let firstName = ''
  const metadataRaw = user?.user_metadata
  if (metadataRaw && typeof metadataRaw === 'object') {
    const metadata = metadataRaw as Record<string, unknown>
    const candidate = (metadata['first_name'] ?? metadata['firstName'])
    if (typeof candidate === 'string') {
      firstName = candidate
    }
  }

  const handleStart = () => {
    router.push('/categories')
  }

  if (loading || checkingOnboarding) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)' }}>
        <div className="text-center">
          <div className="text-xl mb-4" style={{ color: 'var(--foreground)' }}>Loading...</div>
          {onboardingError && (
            <div className="text-sm" style={{ color: 'var(--accent)' }}>
              Error checking onboarding status. 
              <button 
                onClick={() => router.push('/categories')}
                className="ml-2 hover:opacity-80 underline transition-opacity"
                style={{ color: 'var(--accent)' }}
              >
                Continue to categories
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8" style={{ background: 'var(--background)' }}>
      <div className="max-w-2xl w-full space-y-8 text-center">
        <div>
          <h1 className="text-4xl font-extrabold sm:text-5xl sm:tracking-tight lg:text-6xl" style={{ color: 'var(--foreground)' }}>
            Great to see you here on Filo, {firstName || 'friend'}!
          </h1>
          <p className="mt-8 text-xl max-w-3xl mx-auto" style={{ color: 'var(--secondary)' }}>
            To know you better and show you the proper content, I need you to answer some basic questions, right?
          </p>
        </div>

        <div className="mt-12 space-y-4">
          <button
            onClick={handleStart}
            className="apple-button text-lg px-8 py-4"
          >
            Start
          </button>
          
          <div className="text-sm" style={{ color: 'var(--secondary)' }}>
            Having issues? Try these direct links:
            <div className="mt-2 space-x-4">
              <button
                onClick={() => router.push('/categories')}
                className="hover:opacity-80 underline transition-opacity"
                style={{ color: 'var(--accent)' }}
              >
                Go to Categories
              </button>
              <button
                onClick={() => router.push('/feeds')}
                className="hover:opacity-80 underline transition-opacity"
                style={{ color: 'var(--accent)' }}
              >
                Go to Feeds
              </button>
              <button
                onClick={() => router.push('/debug')}
                className="hover:opacity-80 underline transition-opacity"
                style={{ color: 'var(--secondary)' }}
              >
                Debug
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
