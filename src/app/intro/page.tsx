'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function Intro() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/signin')
    }
  }, [user, loading, router])

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
    router.push('/dashboard')
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8 text-center">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
            Great to see you here on Filo, {firstName || 'friend'}!
          </h1>
          <p className="mt-8 text-xl text-gray-600 max-w-3xl mx-auto">
            To know you better and show you the proper content, I need you to answer some basic questions, right?
          </p>
        </div>

        <div className="mt-12">
          <button
            onClick={handleStart}
            className="inline-flex items-center px-8 py-4 border border-transparent text-lg font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
          >
            Start
          </button>
        </div>
      </div>
    </div>
  )
}
