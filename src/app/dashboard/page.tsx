'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getUserPreferences, UserPreferences } from '@/lib/userPreferences'

export default function Dashboard() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null)
  const [preferencesLoading, setPreferencesLoading] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/signin')
    }
  }, [user, loading, router])

  useEffect(() => {
    const fetchUserPreferences = async () => {
      if (user) {
        try {
          const preferences = await getUserPreferences(user.id)
          setUserPreferences(preferences)
        } catch (error) {
          console.error('Error fetching user preferences:', error)
        } finally {
          setPreferencesLoading(false)
        }
      }
    }

    fetchUserPreferences()
  }, [user])

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/signin')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  let firstName = ''
  let lastName = ''
  const metadataRaw = user?.user_metadata
  if (metadataRaw && typeof metadataRaw === 'object') {
    const metadata = metadataRaw as Record<string, unknown>
    const firstNameCandidate = (metadata['first_name'] ?? metadata['firstName'])
    const lastNameCandidate = (metadata['last_name'] ?? metadata['lastName'])
    if (typeof firstNameCandidate === 'string') {
      firstName = firstNameCandidate
    }
    if (typeof lastNameCandidate === 'string') {
      lastName = lastNameCandidate
    }
  }

  // Map category IDs to display names
  const categoryNames: Record<string, string> = {
    'physical-activity': 'Physical activity',
    'emotional-wellbeing': 'Emotional well-being',
    'mindful-awareness': 'Mindful awareness',
    'financial-wellbeing': 'Financial well-being',
    'career-development': 'Career & development',
    'relationships': 'Relationships',
    'nutrition-lifestyle': 'Nutrition & lifestyle'
  }

  const getCategoryDisplayNames = (categoryIds: string[]): string[] => {
    return categoryIds.map(id => categoryNames[id] || id)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
            {firstName ? `Welcome to Filo, ${firstName}! 🎉` : 'Welcome to Filo! 🎉'}
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            {userPreferences && userPreferences.selected_categories.length > 0 ? (
              <>
                You&apos;ve successfully signed in to your account. Later we will show here posts about{' '}
                <span className="font-semibold text-indigo-600">
                  {getCategoryDisplayNames(userPreferences.selected_categories).join(' and ')}
                </span>.
              </>
            ) : (
              'You\'ve successfully signed in to your account. This is your protected dashboard.'
            )}
          </p>
          <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
            <div className="rounded-md shadow">
              <button
                onClick={handleSignOut}
                className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 md:py-4 md:text-lg md:px-10"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>

        <div className="mt-16">
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Account Information
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Your account details
              </p>
            </div>
            <div className="border-t border-gray-200">
              <dl>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">First Name</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {firstName || 'Not provided'}
                  </dd>
                </div>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Last Name</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {lastName || 'Not provided'}
                  </dd>
                </div>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Email</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {user.email}
                  </dd>
                </div>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Selected Categories</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {preferencesLoading ? (
                      <span className="text-gray-400">Loading...</span>
                    ) : userPreferences && userPreferences.selected_categories.length > 0 ? (
                      <div className="space-y-1">
                        {getCategoryDisplayNames(userPreferences.selected_categories).map((category, index) => (
                          <div key={index} className="inline-block bg-indigo-100 text-indigo-800 px-2 py-1 rounded-md text-xs mr-2 mb-1">
                            {category}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-400">No categories selected</span>
                    )}
                  </dd>
                </div>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">User ID</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {user.id}
                  </dd>
                </div>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Created</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {new Date(user.created_at).toLocaleDateString()}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
