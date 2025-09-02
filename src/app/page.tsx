'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (user) {
        // Add a small delay to prevent chunk loading issues
        setTimeout(() => {
          router.push('/feeds')
        }, 100)
      } else {
        setTimeout(() => {
          router.push('/signin')
        }, 100)
      }
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-xl mb-4">Loading...</div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Welcome to Filo</h1>
        <p className="text-gray-600 mb-6">Redirecting you to the right place...</p>
        <div className="space-y-2">
          <Link href="/signin" className="block text-indigo-600 hover:text-indigo-500">
            Go to Sign In
          </Link>
          <Link href="/signup" className="block text-indigo-600 hover:text-indigo-500">
            Go to Sign Up
          </Link>
          <Link href="/debug" className="block text-gray-500 hover:text-gray-400 text-sm">
            Debug Page
          </Link>
        </div>
      </div>
    </div>
  )
}
