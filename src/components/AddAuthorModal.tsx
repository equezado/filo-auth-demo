'use client'

import { useState } from 'react'
import { Author, AuthorFormData } from '@/types/author'
import { createClient } from '@/lib/supabase'

interface AddAuthorModalProps {
  isOpen: boolean
  onClose: () => void
  onAuthorCreated: (author: Author) => void
}

export default function AddAuthorModal({ 
  isOpen, 
  onClose, 
  onAuthorCreated 
}: AddAuthorModalProps) {
  const [formData, setFormData] = useState<AuthorFormData>({
    name: '',
    avatar_url: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      if (!formData.name.trim()) {
        throw new Error('Author name is required')
      }

      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('authors')
        .insert({
          name: formData.name.trim(),
          avatar_url: formData.avatar_url.trim() || null
        })
        .select()
        .single()

      if (error) {
        throw error
      }

      // Reset form
      setFormData({
        name: '',
        avatar_url: ''
      })

      // Notify parent component
      onAuthorCreated(data)
      onClose()
    } catch (error) {
      console.error('Error creating author:', error)
      setError(error instanceof Error ? error.message : 'Failed to create author')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({
        name: '',
        avatar_url: ''
      })
      setError('')
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-[var(--background)] rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--border)]">
          <h2 className="apple-text-large text-[var(--foreground)] font-semibold">
            Add New Author
          </h2>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-[var(--tertiary)] hover:text-[var(--foreground)] transition-colors disabled:opacity-50"
          >
            ×
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-600 apple-text-small">{error}</p>
            </div>
          )}

          {/* Author Name */}
          <div>
            <label htmlFor="name" className="block apple-text-small font-medium text-[var(--foreground)] mb-2">
              Author Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              disabled={isSubmitting}
              className="w-full px-4 py-3 border border-[var(--border)] rounded-lg apple-text-small text-[var(--foreground)] bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="Enter author name"
            />
          </div>

          {/* Author Avatar URL */}
          <div>
            <label htmlFor="avatar_url" className="block apple-text-small font-medium text-[var(--foreground)] mb-2">
              Avatar URL
            </label>
            <input
              type="url"
              id="avatar_url"
              name="avatar_url"
              value={formData.avatar_url}
              onChange={handleInputChange}
              disabled={isSubmitting}
              className="w-full px-4 py-3 border border-[var(--border)] rounded-lg apple-text-small text-[var(--foreground)] bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="https://example.com/avatar.jpg"
            />
            <p className="mt-1 text-[var(--tertiary)] apple-text-caption">
              Optional. Leave empty to use initials as avatar.
            </p>
          </div>

          {/* Preview */}
          {formData.name && (
            <div>
              <label className="block apple-text-small font-medium text-[var(--foreground)] mb-2">
                Preview
              </label>
              <div className="flex items-center gap-3 p-3 border border-[var(--border)] rounded-lg bg-[var(--muted)]">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-[var(--background)] flex-shrink-0">
                  {formData.avatar_url ? (
                    <img
                      src={formData.avatar_url}
                      alt={formData.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[var(--tertiary)] apple-text-small font-medium">
                      {formData.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <span className="apple-text-small text-[var(--foreground)]">
                  {formData.name}
                </span>
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={isSubmitting || !formData.name.trim()}
              className="apple-button flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creating...' : 'Create & Select'}
            </button>
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="apple-button-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
