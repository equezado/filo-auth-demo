'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useAuth } from '@/contexts/AuthContext'
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
  updated_at: string
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

export default function PublisherDashboard() {
  const { user, loading, isPublisher, signOut } = useAuth()
  const router = useRouter()
  const [posts, setPosts] = useState<Post[]>([])
  const [loadingPosts, setLoadingPosts] = useState(true)
  const [stats, setStats] = useState({
    totalPosts: 0,
    recentPosts: 0
  })

  useEffect(() => {
    if (!loading && !user) {
      router.push('/signin')
      return
    }

    if (!loading && user && !isPublisher()) {
      router.push('/feeds')
      return
    }
  }, [user, loading, isPublisher, router])

  useEffect(() => {
    const fetchPublisherPosts = async () => {
      if (!user) return

      try {
        const supabase = createClient()
        
        // Fetch all posts by this publisher
        const { data, error } = await supabase
          .from('posts')
          .select('*')
          .eq('author_id', user.id)
          .order('created_at', { ascending: false })

        if (error) {
          console.error('Error fetching posts:', error)
        } else {
          setPosts(data || [])
          setStats({
            totalPosts: data?.length || 0,
            recentPosts: data?.filter(post => {
              const postDate = new Date(post.created_at)
              const weekAgo = new Date()
              weekAgo.setDate(weekAgo.getDate() - 7)
              return postDate > weekAgo
            }).length || 0
          })
        }
      } catch (error) {
        console.error('Error fetching posts:', error)
      } finally {
        setLoadingPosts(false)
      }
    }

    if (user && isPublisher()) {
      fetchPublisherPosts()
    }
  }, [user, isPublisher])

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/signin')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId)
        .eq('author_id', user?.id)

      if (error) {
        console.error('Error deleting post:', error)
        alert('Failed to delete post')
      } else {
        // Refresh posts
        setPosts(posts.filter(post => post.id !== postId))
        setStats(prev => ({
          ...prev,
          totalPosts: prev.totalPosts - 1
        }))
      }
    } catch (error) {
      console.error('Error deleting post:', error)
      alert('Failed to delete post')
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

  if (!user || !isPublisher()) {
    return null
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <div className="bg-[var(--background)] border-b border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="flex justify-between items-center py-8">
            <div>
              <h1 className="apple-text-large text-[var(--foreground)] mb-2">Publisher Dashboard</h1>
              <p className="apple-text-caption text-[var(--secondary)]">Manage your posts and track your publishing activity</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => router.push('/create-post')}
                className="apple-button"
              >
                Create New Post
              </button>
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
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="apple-card p-6">
            <h3 className="apple-text-medium font-semibold text-[var(--foreground)] mb-2">Total Posts</h3>
            <p className="apple-text-large font-bold text-[var(--accent)]">{stats.totalPosts}</p>
          </div>
          <div className="apple-card p-6">
            <h3 className="apple-text-medium font-semibold text-[var(--foreground)] mb-2">This Week</h3>
            <p className="apple-text-large font-bold text-[var(--accent)]">{stats.recentPosts}</p>
          </div>
          <div className="apple-card p-6">
            <h3 className="apple-text-medium font-semibold text-[var(--foreground)] mb-2">Status</h3>
            <p className="apple-text-small text-green-600 font-medium">Active Publisher</p>
          </div>
        </div>

        {/* Posts Section */}
        <div>
          <div className="flex justify-between items-center mb-8">
            <h2 className="apple-text-large font-semibold text-[var(--foreground)]">Your Posts</h2>
            <button
              onClick={() => router.push('/feeds')}
              className="apple-button-secondary"
            >
              View All Feeds
            </button>
          </div>

          {loadingPosts ? (
            <div className="flex items-center justify-center py-16">
              <div className="apple-text-medium text-[var(--secondary)]">Loading your posts...</div>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-16">
              <div className="apple-text-medium text-[var(--secondary)] mb-4">You haven&apos;t created any posts yet.</div>
              <button
                onClick={() => router.push('/create-post')}
                className="apple-button"
              >
                Create Your First Post
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 max-w-[720px] mx-auto">
              {posts.map((post) => (
                <div key={post.id} className="apple-card overflow-hidden group">
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
                    <div className="flex items-center justify-between mb-4">
                      <span className="inline-block bg-[var(--tertiary)] text-[var(--accent)] apple-text-caption px-3 py-1.5 rounded-full font-medium">
                        {categoryNames[post.category_id] || post.category_id}
                      </span>
                      <span className="apple-text-caption text-[var(--secondary)]">
                        {new Date(post.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      <button
                        onClick={() => router.push(`/edit-post/${post.id}`)}
                        className="apple-button-secondary flex-1"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeletePost(post.id)}
                        className="apple-button-secondary text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
