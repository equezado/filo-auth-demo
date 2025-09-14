'use client'

import { useState } from 'react'
import AuthorSelector from './AuthorSelector'
import AddAuthorModal from './AddAuthorModal'
import { Author } from '@/types/author'

// Mock data for testing
const mockAuthors: Author[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    avatar_url: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    name: 'Mike Chen',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '3',
    name: 'Emma Rodriguez',
    avatar_url: '',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
]

export default function AuthorSelectorTest() {
  const [selectedAuthor, setSelectedAuthor] = useState<Author | null>(null)
  const [showAddAuthorModal, setShowAddAuthorModal] = useState(false)

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

  return (
    <div className="min-h-screen bg-[var(--background)] p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="apple-text-large text-[var(--foreground)] mb-8">
          Author Selector Test
        </h1>
        
        <div className="space-y-6">
          <div>
            <h2 className="apple-text-medium text-[var(--foreground)] mb-4">
              Test Author Selection
            </h2>
            <AuthorSelector
              selectedAuthor={selectedAuthor}
              onAuthorSelect={handleAuthorSelect}
              onAddNewAuthor={handleAddNewAuthor}
            />
          </div>

          {selectedAuthor && (
            <div className="p-4 bg-[var(--muted)] rounded-lg">
              <h3 className="apple-text-small font-medium text-[var(--foreground)] mb-2">
                Selected Author:
              </h3>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-[var(--background)] flex-shrink-0">
                  {selectedAuthor.avatar_url ? (
                    <img
                      src={selectedAuthor.avatar_url}
                      alt={selectedAuthor.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[var(--tertiary)] apple-text-small font-medium">
                      {selectedAuthor.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <span className="apple-text-small text-[var(--foreground)]">
                  {selectedAuthor.name}
                </span>
              </div>
            </div>
          )}

          <div className="p-4 bg-[var(--muted)] rounded-lg">
            <h3 className="apple-text-small font-medium text-[var(--foreground)] mb-2">
              Mock Authors Available:
            </h3>
            <div className="space-y-2">
              {mockAuthors.map((author) => (
                <div key={author.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-[var(--background)] flex-shrink-0">
                    {author.avatar_url ? (
                      <img
                        src={author.avatar_url}
                        alt={author.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[var(--tertiary)] apple-text-small font-medium">
                        {author.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <span className="apple-text-small text-[var(--foreground)]">
                    {author.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <AddAuthorModal
          isOpen={showAddAuthorModal}
          onClose={() => setShowAddAuthorModal(false)}
          onAuthorCreated={handleAuthorCreated}
        />
      </div>
    </div>
  )
}
