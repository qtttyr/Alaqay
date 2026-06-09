import { useCallback, useEffect, useMemo, useState } from "react"

import {
  AccountCard,
  PermissionsCard,
  ProfileDetailsCard,
  RoutineCard,
} from "@/components/profile/ProfileSettings"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { sparksApi, toDateKey } from "@/api/sparksApi"
import { audioService } from "@/lib/audio"
import { useAuth } from "@/hooks/useAuth"
import { notificationService, type NotificationSupportState } from "@/lib/notifications"

const DEFAULT_MORNING = "07:00"
const DEFAULT_EVENING = "21:00"

export function ProfileScreen() {
  const { dataVersion, logout, profile, updateProfile, user } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [isSavingNotifications, setIsSavingNotifications] = useState(false)
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [isSavingRoutine, setIsSavingRoutine] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [permissionState, setPermissionState] = useState<NotificationSupportState>(() => notificationService.getPermission())
  const [rangeSparks, setRangeSparks] = useState<Array<{ date: string; status: string }>>([])
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(true)
  const [nameDraft, setNameDraft] = useState("")
  const [morningDraft, setMorningDraft] = useState(DEFAULT_MORNING)
  const [eveningDraft, setEveningDraft] = useState(DEFAULT_EVENING)
  const [brushDurationDraft, setBrushDurationDraft] = useState(120)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [hapticEnabled, setHapticEnabled] = useState(true)

  // ── Sync audio prefs from profile ──────────────────────────────────────
  useEffect(() => {
    if (!profile) return
    setSoundEnabled(profile.sound_enabled ?? true)
    setHapticEnabled(profile.haptic_enabled ?? true)
  }, [profile?.sound_enabled, profile?.haptic_enabled])

  useEffect(() => {
    if (!user) return
    let cancelled = false

    const load = async () => {
      setIsLoadingMetrics(true)
      const end = new Date()
      const start = addDays(end, -13)

      try {
        await sparksApi.ensureTodaySparks(user.id)
        const range = await sparksApi.getSparksRange(user.id, toDateKey(start), toDateKey(end))
        if (!cancelled) setRangeSparks(range)
      } catch {
        if (!cancelled) setRangeSparks([])
      } finally {
        if (!cancelled) setIsLoadingMetrics(false)
      }
    }

    void load()
    return () => { cancelled = true }
  }, [dataVersion, user])

  const displayName = profile?.username || user?.user_metadata?.username || user?.email?.split("@")[0] || "Alaqay"
  const initials = getInitials(displayName)
  const email = user?.email ?? "No email"
  const morningTime = formatTime(profile?.morning_time ?? DEFAULT_MORNING)
  const eveningTime = formatTime(profile?.evening_time ?? DEFAULT_EVENING)

  const currentDuration = profile?.brush_duration ?? 120
  useEffect(() => {
    setNameDraft(displayName)
    setMorningDraft(morningTime)
    setEveningDraft(eveningTime)
    setBrushDurationDraft(currentDuration)
  }, [currentDuration, displayName, eveningTime, morningTime])

  const { streak, totalSparks, level } = useMemo(() => {
    const s = calculateStreak(rangeSparks)
    const t = rangeSparks.filter((spark) => spark.status === "done").length
    return { streak: s, totalSparks: t, level: getLevel(t) }
  }, [rangeSparks])

  const summary = useMemo(() => ([
    { label: "Streak", value: isLoadingMetrics ? "..." : streak },
    { label: "Sparks", value: isLoadingMetrics ? "..." : totalSparks },
    { label: "Age", value: profile?.age_group ?? "-" },
    { label: "Mode", value: profile?.age_group && profile.age_group < 14 ? "Play" : "Calm" },
  ]), [isLoadingMetrics, profile?.age_group, streak, totalSparks])

  const handleSignOut = async () => {
    setError(null)
    setIsSigningOut(true)
    try {
      await logout()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign out.")
      setIsSigningOut(false)
    }
  }

  const handleToggleNotifications = async () => {
    setError(null)
    setIsSavingNotifications(true)

    try {
      const nextEnabled = !(profile?.notifications_enabled ?? false)
      let nextPermission = notificationService.getPermission()

      if (nextEnabled) {
        nextPermission = await notificationService.requestPermission()
        setPermissionState(nextPermission)
      }

      await updateProfile({
        notification_permission: nextPermission,
        notifications_enabled: nextEnabled && nextPermission === "granted",
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update reminders.")
    } finally {
      setIsSavingNotifications(false)
    }
  }

  const handleToggleSound = useCallback(async () => {
    const next = !soundEnabled
    setSoundEnabled(next)
    audioService.setSoundEnabled(next)
    try {
      await updateProfile({ sound_enabled: next }).catch(() => {})
    } catch {
      // Silently handle — audio still works in-memory
    }
  }, [soundEnabled, updateProfile])

  const handleToggleHaptic = useCallback(async () => {
    const next = !hapticEnabled
    setHapticEnabled(next)
    audioService.setHapticEnabled(next)
    try {
      await updateProfile({ haptic_enabled: next }).catch(() => {})
    } catch {
      // Silently handle — haptic still works in-memory
    }
  }, [hapticEnabled, updateProfile])

  const handleSaveProfile = async () => {
    const username = nameDraft.trim()
    if (!username) {
      setError("Name cannot be empty.")
      return
    }

    setError(null)
    setIsSavingProfile(true)

    try {
      await updateProfile({ username })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update profile.")
    } finally {
      setIsSavingProfile(false)
    }
  }

  const handleSaveRoutine = async () => {
    if (!isValidTime(morningDraft) || !isValidTime(eveningDraft)) {
      setError("Choose valid morning and evening times.")
      return
    }

    setError(null)
    setIsSavingRoutine(true)

    try {
      await updateProfile({
        brush_duration: brushDurationDraft,
        evening_time: eveningDraft,
        morning_time: morningDraft,
      })
      if (user) await sparksApi.ensureTodaySparks(user.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update routine.")
    } finally {
      setIsSavingRoutine(false)
    }
  }

  return (
    <div className="screen-stack">
      <header className="profile-hero">
        <Avatar size="lg" className="profile-avatar">
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div>
          <p className="eyebrow">Profile</p>
          <h1>{displayName}</h1>
          <span>{level}</span>
        </div>
      </header>

      <section className="profile-summary-grid">
        {summary.map((item) => (
          <div key={item.label}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </div>
        ))}
      </section>

      <ProfileDetailsCard
        displayName={nameDraft}
        isSaving={isSavingProfile}
        onDisplayNameChange={setNameDraft}
        onSave={handleSaveProfile}
      />
      <RoutineCard
        brushDuration={brushDurationDraft}
        eveningTime={eveningDraft}
        isSaving={isSavingRoutine}
        morningTime={morningDraft}
        onBrushDurationChange={setBrushDurationDraft}
        onEveningTimeChange={setEveningDraft}
        onMorningTimeChange={setMorningDraft}
        onSave={handleSaveRoutine}
      />
      <PermissionsCard
        hapticEnabled={hapticEnabled}
        isSaving={isSavingNotifications}
        notificationsEnabled={profile?.notifications_enabled ?? false}
        onToggleHaptic={handleToggleHaptic}
        onToggleNotifications={handleToggleNotifications}
        onToggleSound={handleToggleSound}
        permission={permissionState}
        soundEnabled={soundEnabled}
      />
      <AccountCard email={email} error={error} isSigningOut={isSigningOut} onSignOut={handleSignOut} />
    </div>
  )
}

function getInitials(name: string) {
  return name
    .split(/[.\s_-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "AL"
}

function formatTime(value: string) {
  return value.slice(0, 5)
}

function isValidTime(value: string) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value)
}

function calculateStreak(records: Array<{ date: string; status: string }>) {
  const doneDates = new Set(
    records
      .filter((spark) => spark.status === "done")
      .map((spark) => spark.date),
  )

  let streak = 0
  for (let offset = 0; offset < 14; offset += 1) {
    const dateKey = toDateKey(addDays(new Date(), -offset))
    if (!doneDates.has(dateKey)) break
    streak += 1
  }

  return streak
}

function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setDate(date.getDate() + days)
  return next
}

function getLevel(totalSparks: number) {
  if (totalSparks >= 200) return "Spark Master"
  if (totalSparks >= 100) return "Spark Keeper"
  if (totalSparks >= 50) return "Spark Builder"
  if (totalSparks >= 10) return "Spark Starter"
  return "New Spark"
}
