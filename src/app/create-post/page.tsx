'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase'

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
  const { user, loading, isPublisher, signOut } = useAuth()
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category_id: '',
    author_name: '',
    author_avatar: '',
    thumbnail_url: ''
  })
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

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
        const supabase = createClient()
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .order('name')

        if (error) {
          console.error('Error fetching categories:', error)
        } else {
          setCategories(data || [])
        }
      } catch (error) {
        console.error('Error fetching categories:', error)
      }
    }

    if (user && isPublisher()) {
      fetchCategories()
    }
  }, [user, isPublisher])

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
          author_name: formData.author_name,
          author_avatar: formData.author_avatar,
          thumbnail_url: thumbnailUrl,
          author_id: user.id
        })

      if (error) {
        throw error
      }

      // Reset form
      setFormData({
        title: '',
        content: '',
        category_id: '',
        author_name: '',
        author_avatar: '',
        thumbnail_url: ''
      })
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
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="apple-text-medium text-[var(--secondary)]">Loading...</div>
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
            </div>

            {/* Author Name */}
            <div>
              <label htmlFor="author_name" className="block apple-text-small font-medium text-[var(--foreground)] mb-2">
                Author Name *
              </label>
              <input
                type="text"
                id="author_name"
                name="author_name"
                value={formData.author_name}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-[var(--border)] rounded-lg apple-text-small text-[var(--foreground)] bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
                placeholder="Your name as it should appear"
              />
            </div>

            {/* Author Avatar URL */}
            <div>
              <label htmlFor="author_avatar" className="block apple-text-small font-medium text-[var(--foreground)] mb-2">
                Author Avatar URL
              </label>
              <input
                type="url"
                id="author_avatar"
                name="author_avatar"
                value={formData.author_avatar}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-[var(--border)] rounded-lg apple-text-small text-[var(--foreground)] bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
                placeholder="https://example.com/your-avatar.jpg"
              />
            </div>

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
    </div>
  )
}
