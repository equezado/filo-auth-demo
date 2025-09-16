'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase'
import AuthorSelector from '@/components/AuthorSelector'
import AddAuthorModal from '@/components/AddAuthorModal'
import { Author } from '@/types/author'

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
  'nutrition-lifestyle': 'Nutrition & lifestyle'
}

export default function CreatePost() {
  const { user, loading, isPublisher, signOut, error: authError, clearError } = useAuth()
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category_id: '',
    thumbnail_url: ''
  })
  const [selectedAuthor, setSelectedAuthor] = useState<Author | null>(null)
  const [showAddAuthorModal, setShowAddAuthorModal] = useState(false)
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [, setRetryCount] = useState(0)

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
    const fetchCategories = async () => {
      try {
        setError('')
        setCategoriesLoading(true)
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
      } finally {
        setCategoriesLoading(false)
      }
    }

    if (user && isPublisher()) {
      fetchCategories()
    }
  }, [user, isPublisher])

  // Clear auth errors when component mounts
  useEffect(() => {
    if (authError) {
      clearError()
    }
  }, [authError, clearError])

  // Retry function for failed requests
  const handleRetry = () => {
    setRetryCount(prev => prev + 1)
    setError('')
    setCategoriesLoading(true)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file')
        return
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB')
        return
      }

      setThumbnailFile(file)
      setError('')

      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setThumbnailPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeThumbnail = () => {
    setThumbnailFile(null)
    setThumbnailPreview(null)
    setFormData(prev => ({
      ...prev,
      thumbnail_url: ''
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      if (!user) {
        throw new Error('User not authenticated')
      }

      if (!selectedAuthor) {
        throw new Error('Please select an author')
      }

      const supabase = createClient()
      
      let thumbnailUrl = formData.thumbnail_url

      // Upload thumbnail file if provided
      if (thumbnailFile) {
        const fileExt = thumbnailFile.name.split('.').pop()
        const fileName = `${user.id}-${Date.now()}.${fileExt}`
        const filePath = `thumbnails/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('post-images')
          .upload(filePath, thumbnailFile)

        if (uploadError) {
          throw new Error(`Failed to upload image: ${uploadError.message}`)
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('post-images')
          .getPublicUrl(filePath)

        thumbnailUrl = publicUrl
      }
      
      const { error } = await supabase
        .from('posts')
        .insert({
          title: formData.title,
          content: formData.content,
          category_id: formData.category_id,
          author_name: selectedAuthor.name,
          author_avatar: selectedAuthor.avatar_url,
          author_id: selectedAuthor.id,
          thumbnail_url: thumbnailUrl,
          publisher_id: user.id
        })

      if (error) {
        throw error
      }

      // Reset form
      setFormData({
        title: '',
        content: '',
        category_id: '',
        thumbnail_url: ''
      })
      setSelectedAuthor(null)
      setThumbnailFile(null)
      setThumbnailPreview(null)

      // Redirect to feeds
      router.push('/feeds')
    } catch (error) {
      console.error('Error creating post:', error)
      setError(error instanceof Error ? error.message : 'Failed to create post')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAuthorSelect = (author: Author | null) => {
    setSelectedAuthor(author)
  }

  const handleAddNewAuthor = () => {
    setShowAddAuthorModal(true)
  }

  const handleAuthorCreated = (author: Author) => {
    setSelectedAuthor(author)
    setShowAddAuthorModal(false)
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

  if (!user || !isPublisher()) {
    return null
  }

  // Show error state with retry option
  if (error && !categoriesLoading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="apple-text-large text-[var(--foreground)] mb-2">Something went wrong</h1>
          <p className="apple-text-small text-[var(--secondary)] mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
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
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <div className="bg-[var(--background)] border-b border-[var(--border)]">
        <div className="max-w-4xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="flex justify-between items-center py-8">
            <div>
              <h1 className="apple-text-large text-[var(--foreground)] mb-2">Create New Post</h1>
              <p className="apple-text-caption text-[var(--secondary)]">Share your knowledge with the community</p>
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

      <div className="max-w-4xl mx-auto py-12 px-6 sm:px-8 lg:px-12">
        <div className="max-w-2xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-8">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-600 apple-text-small">{error}</p>
              </div>
            )}

            {/* Title */}
            <div>
              <label htmlFor="title" className="block apple-text-small font-medium text-[var(--foreground)] mb-2">
                Post Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-[var(--border)] rounded-lg apple-text-small text-[var(--foreground)] bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
                placeholder="Enter a compelling title for your post"
              />
            </div>

            {/* Content */}
            <div>
              <label htmlFor="content" className="block apple-text-small font-medium text-[var(--foreground)] mb-2">
                Post Content *
              </label>
              <textarea
                id="content"
                name="content"
                value={formData.content}
                onChange={handleInputChange}
                required
                rows={8}
                className="w-full px-4 py-3 border border-[var(--border)] rounded-lg apple-text-small text-[var(--foreground)] bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent resize-vertical"
                placeholder="Write your post content here..."
              />
            </div>

            {/* Category */}
            <div>
              <label htmlFor="category_id" className="block apple-text-small font-medium text-[var(--foreground)] mb-2">
                Category *
              </label>
              {categoriesLoading ? (
                <div className="w-full px-4 py-3 border border-[var(--border)] rounded-lg apple-text-small text-[var(--foreground)] bg-[var(--background)] flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2" style={{ borderColor: 'var(--accent)' }}></div>
                  Loading categories...
                </div>
              ) : (
                <select
                  id="category_id"
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-[var(--border)] rounded-lg apple-text-small text-[var(--foreground)] bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {categoryNames[category.id] || category.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Author Selection */}
            <AuthorSelector
              selectedAuthor={selectedAuthor}
              onAuthorSelect={handleAuthorSelect}
              onAddNewAuthor={handleAddNewAuthor}
              disabled={isSubmitting}
            />

            {/* Thumbnail Upload */}
            <div>
              <label htmlFor="thumbnail" className="block apple-text-small font-medium text-[var(--foreground)] mb-2">
                Thumbnail Image
              </label>
              
              {!thumbnailPreview ? (
                <div className="border-2 border-dashed border-[var(--border)] rounded-lg p-6 text-center hover:border-[var(--accent)] transition-colors">
                  <input
                    type="file"
                    id="thumbnail"
                    name="thumbnail"
                    accept="image/*"
                    onChange={handleThumbnailChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="thumbnail"
                    className="cursor-pointer block"
                  >
                    <div className="text-[var(--secondary)] apple-text-small mb-2">
                      Click to upload or drag and drop
                    </div>
                    <div className="text-[var(--tertiary)] apple-text-caption">
                      PNG, JPG, GIF up to 5MB
                    </div>
                  </label>
                </div>
              ) : (
                <div className="relative">
                  <img
                    src={thumbnailPreview}
                    alt="Thumbnail preview"
                    className="w-full h-48 object-cover rounded-lg border border-[var(--border)]"
                  />
                  <button
                    type="button"
                    onClick={removeThumbnail}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                  >
                    ×
                  </button>
                </div>
              )}
              
              {/* Fallback URL input */}
              <div className="mt-3">
                <label htmlFor="thumbnail_url" className="block apple-text-small font-medium text-[var(--tertiary)] mb-2">
                  Or provide image URL instead
                </label>
                <input
                  type="url"
                  id="thumbnail_url"
                  name="thumbnail_url"
                  value={formData.thumbnail_url}
                  onChange={handleInputChange}
                  disabled={!!thumbnailFile}
                  className="w-full px-4 py-3 border border-[var(--border)] rounded-lg apple-text-small text-[var(--foreground)] bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="https://example.com/thumbnail.jpg"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="apple-button flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Creating Post...' : 'Create Post'}
              </button>
              <button
                type="button"
                onClick={() => router.push('/feeds')}
                className="apple-button-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Add Author Modal */}
      <AddAuthorModal
        isOpen={showAddAuthorModal}
        onClose={() => setShowAddAuthorModal(false)}
        onAuthorCreated={handleAuthorCreated}
      />
    </div>
  )
}
