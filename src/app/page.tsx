'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { hasUserCompletedOnboarding } from '@/lib/userPreferences'

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [checkingOnboarding, setCheckingOnboarding] = useState(false)
  const [redirecting, setRedirecting] = useState(false)

  useEffect(() => {
    if (!loading) {
      if (user) {
        // Check onboarding status for authenticated users
        const checkOnboarding = async () => {
          setCheckingOnboarding(true)
          try {
            const hasCompletedOnboarding = await hasUserCompletedOnboarding(user.id)
            setRedirecting(true)
            if (hasCompletedOnboarding) {
              // User has completed onboarding, go directly to feeds
              router.push('/feeds')
            } else {
              // User hasn't completed onboarding, go to intro
              router.push('/intro')
            }
          } catch (error) {
            console.error('Error checking onboarding status:', error)
            setRedirecting(true)
            // On error, default to intro page
            router.push('/intro')
          } finally {
            setCheckingOnboarding(false)
          }
        }
        
        checkOnboarding()
      } else {
        setRedirecting(true)
        setTimeout(() => {
          router.push('/signin')
        }, 100)
      }
    }
  }, [user, loading, router])

  if (loading || checkingOnboarding || redirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)' }}>
        <div className="text-center">
          <div className="text-xl mb-4" style={{ color: 'var(--foreground)' }}>Loading...</div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto" style={{ borderColor: 'var(--accent)' }}></div>
        </div>
      </div>
    )
  }

  // Fallback UI - only shown if automatic redirects fail
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)' }}>
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4" style={{ color: 'var(--foreground)' }}>Welcome to Filo</h1>
        <p className="mb-6" style={{ color: 'var(--secondary)' }}>Redirecting you to the right place...</p>
        <div className="space-y-2">
          <Link href="/signin" className="block hover:opacity-80 transition-opacity" style={{ color: 'var(--accent)' }}>
            Go to Sign In
          </Link>
          <Link href="/signup" className="block hover:opacity-80 transition-opacity" style={{ color: 'var(--accent)' }}>
            Go to Sign Up
          </Link>
          <Link href="/debug" className="block text-sm hover:opacity-80 transition-opacity" style={{ color: 'var(--secondary)' }}>
            Debug Page
          </Link>
        </div>
      </div>
    </div>
  )
}
