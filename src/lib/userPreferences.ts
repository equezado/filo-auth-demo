import { createClient } from './supabase'

export interface UserPreferences {
  id: string
  user_id: string
  selected_categories: string[]
  created_at: string
  updated_at: string
}

export async function saveUserPreferences(userId: string, selectedCategories: string[]): Promise<void> {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('user_preferences')
    .upsert({
      user_id: userId,
      selected_categories: selectedCategories,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })

  if (error) {
    throw error
  }
}

export async function getUserPreferences(userId: string): Promise<UserPreferences | null> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned
      return null
    }
    throw error
  }

  return data
}

export async function hasUserCompletedOnboarding(userId: string): Promise<boolean> {
  try {
    const preferences = await getUserPreferences(userId)
    console.log('Onboarding check - User ID:', userId, 'Preferences:', preferences)
    return preferences !== null && preferences.selected_categories.length >= 1
  } catch (error) {
    console.error('Error checking onboarding status:', error)
    return false
  }
}
