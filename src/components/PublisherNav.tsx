'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

export default function PublisherNav() {
  const { isPublisher } = useAuth()
  const router = useRouter()

  if (!isPublisher()) {
    return null
  }

  return (
    <nav className="bg-[var(--background)] border-b border-[var(--border)]">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center space-x-8">
            <button
              onClick={() => router.push('/feeds')}
              className="apple-text-small font-medium text-[var(--foreground)] hover:text-[var(--accent)] transition-colors"
            >
              Feeds
            </button>
            <button
              onClick={() => router.push('/publisher-dashboard')}
              className="apple-text-small font-medium text-[var(--foreground)] hover:text-[var(--accent)] transition-colors"
            >
              Dashboard
            </button>
            <button
              onClick={() => router.push('/create-post')}
              className="apple-text-small font-medium text-[var(--foreground)] hover:text-[var(--accent)] transition-colors"
            >
              Create Post
            </button>
          </div>
          <div className="flex items-center space-x-4">
            <span className="apple-text-caption text-[var(--secondary)] bg-[var(--tertiary)] px-3 py-1 rounded-full">
              Publisher
            </span>
          </div>
        </div>
      </div>
    </nav>
  )
}
