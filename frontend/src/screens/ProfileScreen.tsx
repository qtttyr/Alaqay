import { useMemo, useState } from "react"

import {
  AccountCard,
  PermissionsCard,
  RoutineCard,
} from "@/components/profile/ProfileSettings"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { profile as mockProfile } from "@/data/alaqayMock"
import { useAuth } from "@/hooks/useAuth"
import { notificationService, type NotificationSupportState } from "@/lib/notifications"

export function ProfileScreen() {
  const { logout, profile, updateProfile, user } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [isSavingNotifications, setIsSavingNotifications] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [permissionState, setPermissionState] = useState<NotificationSupportState>(() => notificationService.getPermission())

  const displayName = profile?.username || user?.user_metadata?.username || user?.email?.split("@")[0] || "Alaqay"
  const initials = getInitials(displayName)
  const email = user?.email ?? "No email"
  const morningTime = formatTime(profile?.morning_time ?? mockProfile.morningTime)
  const eveningTime = formatTime(profile?.evening_time ?? mockProfile.eveningTime)

  const summary = useMemo(() => ([
    { label: "Streak", value: mockProfile.streak },
    { label: "Sparks", value: mockProfile.totalSparks },
    { label: "Age", value: profile?.age_group ?? mockProfile.age },
    { label: "Mode", value: profile?.age_group && profile.age_group < 14 ? "Play" : "Calm" },
  ]), [profile?.age_group])

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

  return (
    <div className="screen-stack">
      <header className="profile-hero">
        <Avatar size="lg" className="profile-avatar">
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div>
          <p className="eyebrow">Profile</p>
          <h1>{displayName}</h1>
          <span>{mockProfile.level}</span>
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

      <RoutineCard morningTime={morningTime} eveningTime={eveningTime} />
      <PermissionsCard
        isSaving={isSavingNotifications}
        notificationsEnabled={profile?.notifications_enabled ?? false}
        permission={permissionState}
        onToggleNotifications={handleToggleNotifications}
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
