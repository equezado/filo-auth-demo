'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useEffect } from 'react'

export default function DebugRole() {
  const { user, userRole, loading, debugUserRole } = useAuth()

  useEffect(() => {
    if (user && !loading) {
      debugUserRole()
    }
  }, [user, loading, debugUserRole])

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

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Debug User Role</h1>
      
      <div className="space-y-4">
        <div>
          <strong>User ID:</strong> {user?.id || 'Not logged in'}
        </div>
        
        <div>
          <strong>User Email:</strong> {user?.email || 'Not logged in'}
        </div>
        
        <div>
          <strong>User Role:</strong> {userRole?.role || 'No role found'}
        </div>
        
        <div>
          <strong>Is Publisher:</strong> {userRole?.role === 'publisher' ? 'Yes' : 'No'}
        </div>
        
        <div>
          <strong>Loading:</strong> {loading ? 'Yes' : 'No'}
        </div>
      </div>
      
      <button 
        onClick={debugUserRole}
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Debug User Role Again
      </button>
    </div>
  )
}
