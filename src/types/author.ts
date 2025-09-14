export interface Author {
  id: string
  name: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface AuthorFormData {
  name: string
  avatar_url: string
}
