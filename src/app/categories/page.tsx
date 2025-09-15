'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { saveUserPreferences, hasUserCompletedOnboarding } from '@/lib/userPreferences'

interface Category {
  id: string
  name: string
  description: string
}

const categories: Category[] = [
  {
    id: 'physical-activity',
    name: 'Physical activity',
    description: 'Exercise, fitness, and physical health'
  },
  {
    id: 'emotional-wellbeing',
    name: 'Emotional well-being',
    description: 'Mental health, emotions, and psychological balance'
  },
  {
    id: 'mindful-awareness',
    name: 'Mindful awareness',
    description: 'Meditation, mindfulness, and conscious living'
  },
  {
    id: 'financial-wellbeing',
    name: 'Financial well-being',
    description: 'Money management, savings, and financial planning'
  },
  {
    id: 'career-development',
    name: 'Career & development',
    description: 'Professional growth, skills, and career advancement'
  },
  {
    id: 'relationships',
    name: 'Relationships',
    description: 'Family, friends, and social connections'
  },
  {
    id: 'nutrition-lifestyle',
    name: 'Nutrition & lifestyle',
    description: 'Healthy eating, habits, and daily routines'
  }
]

export default function Categories() {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [checkingOnboarding, setCheckingOnboarding] = useState(false)
  const [hasCheckedOnboarding, setHasCheckedOnboarding] = useState(false)
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/signin')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (user && !checkingOnboarding && !hasCheckedOnboarding) {
        setCheckingOnboarding(true)
        try {
          const hasCompletedOnboarding = await hasUserCompletedOnboarding(user.id)
          if (hasCompletedOnboarding) {
            // User has already completed onboarding, redirect to feeds
            router.push('/feeds')
          }
        } catch (error) {
          console.error('Error checking onboarding status:', error)
        } finally {
          setCheckingOnboarding(false)
          setHasCheckedOnboarding(true)
        }
      }
    }

    checkOnboardingStatus()
  }, [user, checkingOnboarding, hasCheckedOnboarding, router])

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories(prev => {
      if (prev.includes(categoryId)) {
        return prev.filter(id => id !== categoryId)
      } else {
        if (prev.length >= 2) {
          return prev
        }
        return [...prev, categoryId]
      }
    })
  }

  const handleContinue = async () => {
    if (selectedCategories.length !== 2) {
      setError('Please select exactly 2 categories')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Save user preferences using the utility function
      if (!user?.id) {
        throw new Error('User ID not available')
      }
      await saveUserPreferences(user.id, selectedCategories)

      // Redirect to feeds
      router.push('/feeds')
    } catch (err) {
      console.error('Error saving preferences:', err)
      setError('Failed to save preferences. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || checkingOnboarding) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)' }}>
        <div className="text-xl" style={{ color: 'var(--foreground)' }}>Loading...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8" style={{ background: 'var(--background)' }}>
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-extrabold sm:text-4xl" style={{ color: 'var(--foreground)' }}>
            Select two areas you feel more investment now?
          </h1>
          <p className="mt-4 text-lg" style={{ color: 'var(--secondary)' }}>
            Choose the two categories that resonate most with your current goals and interests.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {categories.map((category) => (
            <div
              key={category.id}
              className={`relative p-6 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                selectedCategories.includes(category.id)
                  ? 'shadow-md'
                  : 'hover:shadow-sm'
              }`}
              style={{
                borderColor: selectedCategories.includes(category.id) ? 'var(--accent)' : 'var(--border)',
                backgroundColor: selectedCategories.includes(category.id) ? 'var(--tertiary)' : 'var(--background-secondary)'
              }}
              onClick={() => handleCategoryToggle(category.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
                    {category.name}
                  </h3>
                  <p className="text-sm" style={{ color: 'var(--secondary)' }}>
                    {category.description}
                  </p>
                </div>
                {selectedCategories.includes(category.id) && (
                  <div className="ml-4 flex-shrink-0">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--accent)' }}>
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {error && (
          <div className="text-center mb-6">
            <p className="text-sm" style={{ color: 'var(--accent)' }}>{error}</p>
          </div>
        )}

        <div className="text-center">
          <div className="mb-4">
            <p className="text-sm" style={{ color: 'var(--secondary)' }}>
              Selected: {selectedCategories.length}/2 categories
            </p>
          </div>
          
          <button
            onClick={handleContinue}
            disabled={selectedCategories.length !== 2 || loading}
            className="apple-button px-8 py-4 text-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  )
}
