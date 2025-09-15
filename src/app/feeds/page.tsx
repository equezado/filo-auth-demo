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

interface Category {
  id: string
  name: string
  description: string
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
  const { user, loading, signOut, isPublisher, error: authError, clearError, clearAuthData } = useAuth()
  const router = useRouter()
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [loadingPosts, setLoadingPosts] = useState(true)
  const [preferencesLoading, setPreferencesLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [categories, setCategories] = useState<Category[]>([])
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/signin')
    }
  }, [user, loading, router])

  // Clear auth errors when component mounts
  useEffect(() => {
    if (authError) {
      clearError()
    }
  }, [authError, clearError])

  useEffect(() => {
    const fetchUserPreferences = async () => {
      if (user) {
        try {
          setError(null)
          const preferences = await getUserPreferences(user.id)
          setUserPreferences(preferences)
        } catch (error) {
          console.error('Error fetching user preferences:', error)
          setError('Failed to load user preferences. Please try refreshing the page.')
        } finally {
          setPreferencesLoading(false)
        }
      } else {
        setPreferencesLoading(false)
      }
    }

    const fetchCategories = async () => {
      try {
        setError(null)
        const supabase = createClient()
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .order('name')

        if (error) {
          console.error('Error fetching categories:', error)
          setError('Failed to load categories. Please try refreshing the page.')
        } else {
          setCategories(data || [])
        }
      } catch (error) {
        console.error('Error fetching categories:', error)
        setError('Network error loading categories. Please check your connection.')
      }
    }

    if (user) {
      fetchUserPreferences()
      fetchCategories()
    }
  }, [user])

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setError(null)
        setLoadingPosts(true)
        
        // Publishers see all posts (with optional category filter), readers see only their selected categories
        if (isPublisher()) {
          // Fetch all posts for publishers, optionally filtered by category
          const supabase = createClient()
          let query = supabase
            .from('posts')
            .select('*')
            .order('created_at', { ascending: false })

          // Apply category filter if selected
          if (selectedCategory) {
            query = query.eq('category_id', selectedCategory)
          }

          const { data, error } = await query

          if (error) {
            console.error('Error fetching posts:', error)
            setError('Failed to load posts. Please try refreshing the page.')
            setPosts([])
          } else {
            setPosts(data || [])
          }
        } else {
          // Regular readers see only their selected categories
          if (!userPreferences || userPreferences.selected_categories.length === 0) {
            setPosts([])
            return
          }

          const supabase = createClient()
          
          // Fetch posts from all user-selected categories
          const { data, error } = await supabase
            .from('posts')
            .select('*')
            .in('category_id', userPreferences.selected_categories)
            .order('created_at', { ascending: false })

          if (error) {
            console.error('Error fetching posts:', error)
            setError('Failed to load posts. Please try refreshing the page.')
            setPosts([])
          } else {
            setPosts(data || [])
          }
        }
      } catch (error) {
        console.error('Error fetching posts:', error)
        setError('Network error loading posts. Please check your connection.')
        setPosts([])
      } finally {
        setLoadingPosts(false)
      }
    }

    // Only fetch posts if we have the necessary data
    if (isPublisher() || (!preferencesLoading && userPreferences !== null)) {
      fetchPosts()
    }
  }, [userPreferences, preferencesLoading, isPublisher, selectedCategory])

  // Retry function for failed requests
  const handleRetry = () => {
    setRetryCount(prev => prev + 1)
    setError(null)
    setLoadingPosts(true)
    setPreferencesLoading(true)
  }

  // Handle refresh token errors by clearing auth data
  const handleRefreshTokenError = async () => {
    try {
      await clearAuthData()
      router.push('/signin')
    } catch (error) {
      console.error('Error clearing auth data:', error)
      // Force page reload as fallback
      window.location.href = '/signin'
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/signin')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }


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
    return null
  }

  // Show error state with retry option
  if (error) {
    const isRefreshTokenError = error.includes('session has expired') || 
                               error.includes('Invalid Refresh Token') || 
                               error.includes('Refresh Token Not Found')
    
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="apple-text-large text-[var(--foreground)] mb-2">
            {isRefreshTokenError ? 'Session Expired' : 'Something went wrong'}
          </h1>
          <p className="apple-text-small text-[var(--secondary)] mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            {isRefreshTokenError ? (
              <button
                onClick={handleRefreshTokenError}
                className="apple-button"
              >
                Sign In Again
              </button>
            ) : (
              <>
                <button
                  onClick={handleRetry}
                  className="apple-button"
                >
                  Try Again
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="apple-button-secondary"
                >
                  Refresh Page
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Only show category selection message for readers, not publishers
  if (!isPublisher() && (!userPreferences || userPreferences.selected_categories.length === 0)) {
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
              <h1 className="apple-text-large text-[var(--foreground)] mb-2">
                {isPublisher() ? 'All Posts' : 'Your Feeds'}
              </h1>
              <p className="apple-text-caption text-[var(--secondary)]">
                {isPublisher() 
                  ? 'All posts from all categories, ordered by date' 
                  : 'All posts from your selected categories, ordered by date'
                }
              </p>
            </div>
            <div className="flex gap-3">
              {isPublisher() && (
                <button
                  onClick={() => router.push('/create-post')}
                  className="apple-button"
                >
                  Create Post
                </button>
              )}
              <button
                onClick={handleSignOut}
                className="apple-button-secondary"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-12 px-6 sm:px-8 lg:px-12">
        {/* Category Filter for Publishers */}
        {isPublisher() && (
          <div className="mb-8">
            <div className="max-w-[560px] mx-auto">
              <label htmlFor="category-filter" className="block apple-text-small font-medium text-[var(--foreground)] mb-2">
                Filter by Category (Optional)
              </label>
              <select
                id="category-filter"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-3 border border-[var(--border)] rounded-lg apple-text-small text-[var(--foreground)] bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {categoryNames[category.id] || category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Posts Count for Publishers */}
        {isPublisher() && !loadingPosts && posts.length > 0 && (
          <div className="max-w-[560px] mx-auto mb-6">
            <div className="apple-text-caption text-[var(--secondary)]">
              Showing {posts.length} post{posts.length !== 1 ? 's' : ''}
              {selectedCategory && ` in ${categoryNames[selectedCategory] || selectedCategory} category`}
            </div>
          </div>
        )}

        {/* Posts Grid */}
        {loadingPosts || preferencesLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="text-xl mb-4" style={{ color: 'var(--foreground)' }}>
                {preferencesLoading ? 'Loading preferences...' : 'Loading posts...'}
              </div>
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto" style={{ borderColor: 'var(--accent)' }}></div>
            </div>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16">
            <div className="apple-text-medium text-[var(--secondary)]">
              {isPublisher() 
                ? (selectedCategory 
                    ? `No posts found in ${categoryNames[selectedCategory] || selectedCategory} category.` 
                    : 'No posts found. Be the first to create a post!'
                  )
                : 'No posts found in your selected categories.'
              }
            </div>
            {isPublisher() && !selectedCategory && (
              <button
                onClick={() => router.push('/create-post')}
                className="apple-button mt-4"
              >
                Create Your First Post
              </button>
            )}
            {isPublisher() && selectedCategory && (
              <button
                onClick={() => setSelectedCategory('')}
                className="apple-button-secondary mt-4"
              >
                Show All Categories
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 max-w-[560px] mx-auto">
            {posts.map((post) => (
              <div key={post.id} className="apple-card overflow-hidden group cursor-pointer">
                {/* Thumbnail */}
                <div className="aspect-video bg-[var(--tertiary)] relative overflow-hidden">
                  {post.thumbnail_url && post.thumbnail_url.trim() !== '' ? (
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
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-[var(--tertiary)]">
                      <div className="text-center">
                        <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-[var(--border)] flex items-center justify-center">
                          <svg className="w-8 h-8 text-[var(--secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <p className="apple-text-caption text-[var(--secondary)]">No image</p>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Content */}
                <div className="p-8">
                  {/* Author Info */}
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 rounded-full mr-4 relative overflow-hidden border border-[var(--border)]">
                      {post.author_avatar && post.author_avatar.trim() !== '' ? (
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
                      ) : (
                        <div className="w-full h-full bg-[var(--tertiary)] flex items-center justify-center">
                          <svg className="w-6 h-6 text-[var(--secondary)]" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
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
