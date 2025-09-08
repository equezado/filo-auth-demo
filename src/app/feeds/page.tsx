'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useAuth } from '@/contexts/AuthContext'
import { getUserPreferences, UserPreferences } from '@/lib/userPreferences'
import { createClient } from '@/lib/supabase'

interface Post {
  id: string
  title: string
  content: string
  author_name: string
  author_avatar: string
  thumbnail_url: string
  category_id: string
  created_at: string
}



const categoryNames: Record<string, string> = {
  'physical-activity': 'Physical activity',
  'emotional-wellbeing': 'Emotional well-being',
  'mindful-awareness': 'Mindful awareness',
  'financial-wellbeing': 'Financial well-being',
  'career-development': 'Career & development',
  'relationships': 'Relationships',
  'nutrition-lifestyle': 'Dieta e nutrição'
}

export default function Feeds() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [loadingPosts, setLoadingPosts] = useState(true)
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

  useEffect(() => {
    const fetchPosts = async () => {
      if (!userPreferences || userPreferences.selected_categories.length === 0) {
        setLoadingPosts(false)
        return
      }

      try {
        const supabase = createClient()
        
        // Fetch posts from all user-selected categories
        const { data, error } = await supabase
          .from('posts')
          .select('*')
          .in('category_id', userPreferences.selected_categories)
          .order('created_at', { ascending: false })

        if (error) {
          console.error('Error fetching posts:', error)
        } else {
          setPosts(data || [])
        }
      } catch (error) {
        console.error('Error fetching posts:', error)
      } finally {
        setLoadingPosts(false)
      }
    }

    if (!preferencesLoading) {
      fetchPosts()
    }
  }, [userPreferences, preferencesLoading])

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/signin')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }


  if (loading || preferencesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="apple-text-medium text-[var(--secondary)]">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  if (!userPreferences || userPreferences.selected_categories.length === 0) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <h1 className="apple-text-large text-[var(--foreground)] mb-4">No Categories Selected</h1>
          <p className="apple-text-small text-[var(--secondary)] mb-8">Please select your preferred categories to see personalized feeds.</p>
          <button
            onClick={() => router.push('/categories')}
            className="apple-button"
          >
            Select Categories
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <div className="bg-[var(--background)] border-b border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="flex justify-between items-center py-8">
            <div>
              <h1 className="apple-text-large text-[var(--foreground)] mb-2">Your Feeds</h1>
              <p className="apple-text-caption text-[var(--secondary)]">All posts from your selected categories, ordered by date</p>
            </div>
            <button
              onClick={handleSignOut}
              className="apple-button-secondary"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-12 px-6 sm:px-8 lg:px-12">

        {/* Posts Grid */}
        {loadingPosts ? (
          <div className="flex items-center justify-center py-16">
            <div className="apple-text-medium text-[var(--secondary)]">Loading posts...</div>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16">
            <div className="apple-text-medium text-[var(--secondary)]">No posts found in your selected categories.</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 max-w-[720px] mx-auto">
            {posts.map((post) => (
              <div key={post.id} className="apple-card overflow-hidden group cursor-pointer">
                {/* Thumbnail */}
                <div className="aspect-video bg-[var(--tertiary)] relative overflow-hidden">
                  <Image
                    src={post.thumbnail_url}
                    alt={post.title}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.src = 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=250&fit=crop'
                    }}
                  />
                </div>
                
                {/* Content */}
                <div className="p-8">
                  {/* Author Info */}
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 rounded-full mr-4 relative overflow-hidden border border-[var(--border)]">
                      <Image
                        src={post.author_avatar}
                        alt={post.author_name}
                        fill
                        className="object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
                        }}
                      />
                    </div>
                    <span className="apple-text-small font-medium text-[var(--foreground)]">{post.author_name}</span>
                  </div>
                  
                  {/* Title */}
                  <h3 className="apple-text-medium font-semibold text-[var(--foreground)] mb-3 line-clamp-2 leading-tight">
                    {post.title}
                  </h3>
                  
                  {/* Content Preview */}
                  <p className="apple-text-small text-[var(--secondary)] line-clamp-3 mb-6 leading-relaxed">
                    {post.content}
                  </p>
                  
                  {/* Category Badge and Date */}
                  <div className="flex items-center justify-between">
                    <span className="inline-block bg-[var(--tertiary)] text-[var(--accent)] apple-text-caption px-3 py-1.5 rounded-full font-medium">
                      {categoryNames[post.category_id] || post.category_id}
                    </span>
                    <span className="apple-text-caption text-[var(--secondary)]">
                      {new Date(post.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
