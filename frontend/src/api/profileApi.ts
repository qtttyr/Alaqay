import { supabase } from "@/lib/supabase"

export type Profile = {
  id: string
  username: string | null
  age_group: number | null
  morning_time: string
  evening_time: string
  notifications_enabled: boolean
  notification_permission: NotificationPermission | "unsupported" | null
  onboarding_completed: boolean
  sound_enabled: boolean | null
  haptic_enabled: boolean | null
  brush_duration: number | null
  created_at: string
  updated_at: string
}

const profilesTable = supabase.from("profiles")

type OnboardingProfileData = {
  age_group: number
  morning_time: string
  evening_time: string
}

export const profileApi = {
  async getProfile(userId: string) {
    const { data, error } = await profilesTable
      .select("*")
      .eq("id", userId)
      .single()
    if (error) throw error
    return data as Profile
  },

  async ensureProfile(userId: string, username?: string | null) {
    const { data, error } = await profilesTable
      .upsert({ id: userId, username: username ?? null }, { onConflict: "id" })
      .select()
      .single()
    if (error) throw error
    return data as Profile
  },

  async updateProfile(userId: string, updates: Partial<Omit<Profile, "id" | "created_at" | "updated_at">>) {
    const { data, error } = await profilesTable
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", userId)
      .select()
      .single()
    if (error) throw error
    return data as Profile
  },

  async completeOnboarding(userId: string, profileData: OnboardingProfileData) {
    const { data, error } = await profilesTable
      .upsert({
        id: userId,
        ...profileData,
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      }, { onConflict: "id" })
      .select()
      .single()
    if (error) throw error
    return data as Profile
  },
}
