import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { Profile, UserRole } from '@/types'

interface AuthState {
  profile: Profile | null
  loading: boolean
  setProfile: (profile: Profile | null) => void
  setLoading: (v: boolean) => void
  hasRole: (...roles: UserRole[]) => boolean
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  profile: null,
  loading: true,
  setProfile: (profile) => set({ profile }),
  setLoading: (loading) => set({ loading }),
  hasRole: (...roles) => {
    const { profile } = get()
    return profile ? roles.includes(profile.role) : false
  },
  logout: async () => {
    await supabase.auth.signOut()
    set({ profile: null })
  },
}))
