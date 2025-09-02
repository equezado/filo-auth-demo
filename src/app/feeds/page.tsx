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
  'nutrition-lifestyle': 'Nutrition & lifestyle'
}

export default function Feeds() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [loadingPosts, setLoadingPosts] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
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
          if (preferences && preferences.selected_categories.length > 0) {
            setSelectedCategory(preferences.selected_categories[0])
          }
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
        const categoryFilter = selectedCategory || userPreferences.selected_categories[0]
        
        const { data, error } = await supabase
          .from('posts')
          .select('*')
          .eq('category_id', categoryFilter)
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
  }, [userPreferences, selectedCategory, preferencesLoading])

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/signin')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId)
  }

  if (loading || preferencesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  if (!userPreferences || userPreferences.selected_categories.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">No Categories Selected</h1>
          <p className="text-gray-600 mb-6">Please select your preferred categories to see personalized feeds.</p>
          <button
            onClick={() => router.push('/categories')}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Select Categories
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Your Feeds</h1>
              <p className="text-sm text-gray-600">Personalized content based on your interests</p>
            </div>
            <button
              onClick={handleSignOut}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Category Filter */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            {userPreferences.selected_categories.map((categoryId) => (
              <button
                key={categoryId}
                onClick={() => handleCategoryChange(categoryId)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === categoryId
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {categoryNames[categoryId] || categoryId}
              </button>
            ))}
          </div>
        </div>

        {/* Posts Grid */}
        {loadingPosts ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-lg text-gray-600">Loading posts...</div>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-lg text-gray-600">No posts found for this category.</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <div key={post.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                {/* Thumbnail */}
                <div className="aspect-video bg-gray-200 relative">
                  <Image
                    src={post.thumbnail_url}
                    alt={post.title}
                    fill
                    className="object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.src = 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=250&fit=crop'
                    }}
                  />
                </div>
                
                {/* Content */}
                <div className="p-6">
                  {/* Author Info */}
                  <div className="flex items-center mb-3">
                    <div className="w-8 h-8 rounded-full mr-3 relative overflow-hidden">
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
                    <span className="text-sm font-medium text-gray-900">{post.author_name}</span>
                  </div>
                  
                  {/* Title */}
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                    {post.title}
                  </h3>
                  
                  {/* Content Preview */}
                  <p className="text-gray-600 text-sm line-clamp-3 mb-4">
                    {post.content}
                  </p>
                  
                  {/* Category Badge */}
                  <div className="flex items-center justify-between">
                    <span className="inline-block bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded-full">
                      {categoryNames[post.category_id] || post.category_id}
                    </span>
                    <span className="text-xs text-gray-500">
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
