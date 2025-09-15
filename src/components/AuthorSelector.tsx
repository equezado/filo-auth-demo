'use client'

import { useState, useEffect, useRef } from 'react'
import { Author } from '@/types/author'
import { createClient } from '@/lib/supabase'

interface AuthorSelectorProps {
  selectedAuthor: Author | null
  onAuthorSelect: (author: Author | null) => void
  onAddNewAuthor: () => void
  disabled?: boolean
}

export default function AuthorSelector({ 
  selectedAuthor, 
  onAuthorSelect, 
  onAddNewAuthor,
  disabled = false 
}: AuthorSelectorProps) {
  const [authors, setAuthors] = useState<Author[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [retryCount, setRetryCount] = useState(0)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Fetch authors from database with retry logic
  const fetchAuthors = async (retries = 3) => {
    try {
      setLoading(true)
      setError('')
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('authors')
        .select('*')
        .order('name')

      if (error) {
        throw error
      }

      setAuthors(data || [])
    } catch (error) {
      console.error('Error fetching authors:', error)
      if (retries > 0) {
        // Retry with exponential backoff
        setTimeout(() => {
          fetchAuthors(retries - 1)
        }, 1000 * (4 - retries))
      } else {
        setError('Failed to load authors. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  // Fetch authors on component mount
  useEffect(() => {
    fetchAuthors()
  }, [])

  // Retry function
  const handleRetry = () => {
    setRetryCount(prev => prev + 1)
    setError('')
    fetchAuthors()
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchTerm('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Filter authors based on search term
  const filteredAuthors = authors.filter(author =>
    author.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleAuthorSelect = (author: Author) => {
    onAuthorSelect(author)
    setIsOpen(false)
    setSearchTerm('')
  }

  const handleAddNewAuthor = () => {
    onAddNewAuthor()
    setIsOpen(false)
    setSearchTerm('')
  }

  const handleInputFocus = () => {
    if (!disabled) {
      setIsOpen(true)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
    if (!isOpen) {
      setIsOpen(true)
    }
  }

  const clearSelection = () => {
    onAuthorSelect(null)
    setSearchTerm('')
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block apple-text-small font-medium text-[var(--foreground)] mb-2">
        Author *
      </label>
      
      {/* Input field */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={selectedAuthor ? selectedAuthor.name : searchTerm}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          disabled={disabled}
          placeholder="Search or select an author..."
          className="w-full px-4 py-3 border border-[var(--border)] rounded-lg apple-text-small text-[var(--foreground)] bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
        />
        
        {/* Clear button */}
        {selectedAuthor && !disabled && (
          <button
            type="button"
            onClick={clearSelection}
            className="absolute right-10 top-1/2 transform -translate-y-1/2 text-[var(--tertiary)] hover:text-[var(--foreground)] transition-colors"
          >
            ×
          </button>
        )}
        
        {/* Dropdown arrow */}
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[var(--tertiary)] hover:text-[var(--foreground)] transition-colors disabled:opacity-50"
        >
          {isOpen ? '▲' : '▼'}
        </button>
      </div>

      {/* Error message */}
      {error && (
        <p className="mt-1 text-red-600 apple-text-caption">{error}</p>
      )}

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-[var(--background)] border border-[var(--border)] rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {loading ? (
            <div className="px-4 py-3 text-center text-[var(--tertiary)] apple-text-small flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2" style={{ borderColor: 'var(--accent)' }}></div>
              Loading authors...
            </div>
          ) : error ? (
            <div className="px-4 py-3 text-center">
              <div className="text-red-600 apple-text-small mb-2">{error}</div>
              <button
                type="button"
                onClick={handleRetry}
                className="text-[var(--accent)] apple-text-small font-medium hover:underline"
              >
                Try Again
              </button>
            </div>
          ) : filteredAuthors.length > 0 ? (
            <>
              {filteredAuthors.map((author) => (
                <button
                  key={author.id}
                  type="button"
                  onClick={() => handleAuthorSelect(author)}
                  className="w-full px-4 py-3 text-left hover:bg-[var(--muted)] transition-colors flex items-center gap-3"
                >
                  {/* Author avatar */}
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-[var(--muted)] flex-shrink-0">
                    {author.avatar_url ? (
                      <img
                        src={author.avatar_url}
                        alt={author.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.style.display = 'none'
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[var(--tertiary)] apple-text-small font-medium">
                        {author.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  
                  {/* Author name */}
                  <span className="apple-text-small text-[var(--foreground)] truncate">
                    {author.name}
                  </span>
                </button>
              ))}
              
              {/* Add new author option */}
              <button
                type="button"
                onClick={handleAddNewAuthor}
                className="w-full px-4 py-3 text-left hover:bg-[var(--muted)] transition-colors border-t border-[var(--border)] flex items-center gap-3 text-[var(--accent)]"
              >
                <div className="w-8 h-8 rounded-full bg-[var(--accent)] flex items-center justify-center text-white apple-text-small font-medium">
                  +
                </div>
                <span className="apple-text-small font-medium">
                  Add New Author
                </span>
              </button>
            </>
          ) : (
            <div className="px-4 py-3 text-center">
              <p className="text-[var(--tertiary)] apple-text-small mb-2">
                {searchTerm ? 'No authors found' : 'No authors available'}
              </p>
              <button
                type="button"
                onClick={handleAddNewAuthor}
                className="text-[var(--accent)] apple-text-small font-medium hover:underline"
              >
                Add New Author
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
