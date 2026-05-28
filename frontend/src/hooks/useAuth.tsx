import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import type { Session, User } from "@supabase/supabase-js"

import { profileApi, type Profile } from "@/api/profileApi"
import { sparksApi } from "@/api/sparksApi"
import { supabase } from "@/lib/supabase"
import type { AppTab } from "@/types/navigation"

type CompleteOnboardingData = {
  age_group: number
  morning_time: string
  evening_time: string
}

type AuthContextValue = {
  activeTab: AppTab
  completeOnboarding: (profileData: CompleteOnboardingData) => Promise<void>
  dataVersion: number
  goToBrush: () => void
  isAuthenticated: boolean
  isLoading: boolean
  isOnboardingComplete: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  profile: Profile | null
  refreshAppData: () => void
  setActiveTab: (tab: AppTab) => void
  signInWithGoogle: () => Promise<void>
  signUp: (email: string, password: string, username?: string) => Promise<boolean>
  updateProfile: (updates: Partial<Omit<Profile, "id" | "created_at" | "updated_at">>) => Promise<Profile>
  user: User | null
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [activeTab, setActiveTab] = useState<AppTab>("home")
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [dataVersion, setDataVersion] = useState(0)

  const refreshAppData = useCallback(() => {
    setDataVersion((version) => version + 1)
  }, [])

  const loadUserProfile = useCallback(async (authUser: User) => {
    try {
      const loadedProfile = await profileApi.getProfile(authUser.id)
      setProfile(loadedProfile)
      if (loadedProfile.onboarding_completed) {
        void sparksApi.ensureTodaySparks(authUser.id)
      }
    } catch {
      const createdProfile = await profileApi.ensureProfile(
        authUser.id,
        authUser.user_metadata?.username ?? authUser.email ?? null,
      )
      setProfile(createdProfile)
    }
  }, [])

  const applySession = useCallback(async (session: Session | null) => {
    const authUser = session?.user ?? null
    setUser(authUser)

    if (!authUser) {
      setProfile(null)
      return
    }

    await loadUserProfile(authUser)
  }, [loadUserProfile])

  useEffect(() => {
    let cancelled = false

    const init = async () => {
      const { data, error } = await supabase.auth.getSession()
      if (cancelled) return
      if (error) {
        setUser(null)
        setProfile(null)
      } else {
        await applySession(data.session)
      }
      if (!cancelled) setIsLoading(false)
    }

    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (cancelled) return
        const authUser = session?.user ?? null
        setUser(authUser)
        if (authUser) {
          void loadUserProfile(authUser)
        } else {
          setProfile(null)
        }
        setIsLoading(false)
      },
    )

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [applySession])

  const login = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }, [])

  const signUp = useCallback(async (email: string, password: string, username?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username: username || email.split("@")[0] },
        emailRedirectTo: `${window.location.origin}/app/home`,
      },
    })
    if (error) throw error

    if (data.session?.user) {
      setUser(data.session.user)
      await loadUserProfile(data.session.user)
      return true
    }

    return false
  }, [loadUserProfile])

  const signInWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/app/home` },
    })
    if (error) throw error
  }, [])

  const logout = useCallback(async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    setUser(null)
    setProfile(null)
  }, [])

  const completeOnboarding = useCallback(async (profileData: CompleteOnboardingData) => {
    if (!user) throw new Error("You need to sign in first.")
    const updatedProfile = await profileApi.completeOnboarding(user.id, profileData)
    await sparksApi.ensureTodaySparks(user.id)
    setProfile(updatedProfile)
    refreshAppData()
  }, [refreshAppData, user])

  const updateProfile = useCallback(async (updates: Partial<Omit<Profile, "id" | "created_at" | "updated_at">>) => {
    if (!user) throw new Error("You need to sign in first.")
    const updatedProfile = await profileApi.updateProfile(user.id, updates)
    setProfile(updatedProfile)
    refreshAppData()
    return updatedProfile
  }, [refreshAppData, user])

  const value = useMemo<AuthContextValue>(() => ({
    activeTab,
    completeOnboarding,
    dataVersion,
    goToBrush: () => setActiveTab("mirror"),
    isAuthenticated: !!user,
    isLoading,
    isOnboardingComplete: profile?.onboarding_completed ?? false,
    login,
    logout,
    profile,
    refreshAppData,
    setActiveTab,
    signInWithGoogle,
    signUp,
    updateProfile,
    user,
  }), [
    activeTab,
    completeOnboarding,
    dataVersion,
    isLoading,
    login,
    logout,
    profile,
    refreshAppData,
    signInWithGoogle,
    signUp,
    updateProfile,
    user,
  ])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider")
  }
  return context
}
