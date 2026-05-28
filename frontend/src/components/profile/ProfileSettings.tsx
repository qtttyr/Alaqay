import { HugeiconsIcon } from "@hugeicons/react"
import type { ComponentProps, ReactNode } from "react"
import {
  Camera01Icon,
  Clock01Icon,
  Logout03Icon,
  Moon02Icon,
  Notification02Icon,
  Settings02Icon,
  ShieldUserIcon,
  Sun01Icon,
  UserCircleIcon,
} from "@hugeicons/core-free-icons"

import { Button } from "@/components/ui/button"
import type { NotificationSupportState } from "@/lib/notifications"

type SettingRowProps = {
  helper: string
  icon: ComponentProps<typeof HugeiconsIcon>["icon"]
  label: string
  value: string
}

type RoutineCardProps = {
  eveningTime: string
  morningTime: string
}

type AccountCardProps = {
  email: string
  error: string | null
  isSigningOut: boolean
  onSignOut: () => void
}

type PermissionsCardProps = {
  isSaving: boolean
  notificationsEnabled: boolean
  onToggleNotifications: () => void
  permission: NotificationSupportState
}

export function RoutineCard({ eveningTime, morningTime }: RoutineCardProps) {
  return (
    <section className="profile-card">
      <ProfileSectionTitle icon={Clock01Icon} title="Spark routine" />
      <div className="routine-settings-grid">
        <SettingPill icon={Sun01Icon} label="Morning" value={morningTime} />
        <SettingPill icon={Moon02Icon} label="Evening" value={eveningTime} />
      </div>
    </section>
  )
}

export function PermissionsCard({
  isSaving,
  notificationsEnabled,
  onToggleNotifications,
  permission,
}: PermissionsCardProps) {
  const reminderValue = getReminderValue(notificationsEnabled, permission)

  return (
    <section className="profile-card">
      <ProfileSectionTitle icon={Settings02Icon} title="Comfort settings" />
      <div className="settings-rows">
        <SettingRow
          action={(
            <Button
              className="setting-row-button"
              size="sm"
              variant={notificationsEnabled ? "outline" : "default"}
              onClick={onToggleNotifications}
              disabled={isSaving || permission === "unsupported"}
            >
              {isSaving ? "Saving" : notificationsEnabled ? "Turn off" : "Enable"}
            </Button>
          )}
          icon={Notification02Icon}
          label="Reminders"
          value={reminderValue}
          helper="Soft pushes around your Spark times."
        />
        <SettingRow icon={Camera01Icon} label="Camera" value="Ask first" helper="Mirror mode requests access only when opened." />
        <SettingRow icon={ShieldUserIcon} label="Privacy" value="Protected" helper="Your routine belongs to your account." />
      </div>
    </section>
  )
}

export function AccountCard({ email, error, isSigningOut, onSignOut }: AccountCardProps) {
  return (
    <section className="profile-card account-card">
      <ProfileSectionTitle icon={UserCircleIcon} title="Account" />
      <div className="account-email">
        <span>Email</span>
        <strong>{email}</strong>
      </div>
      {error && <p className="profile-error">{error}</p>}
      <Button className="sign-out-button" variant="outline" onClick={onSignOut} disabled={isSigningOut}>
        <HugeiconsIcon icon={Logout03Icon} size={18} />
        {isSigningOut ? "Signing out..." : "Sign out"}
      </Button>
    </section>
  )
}

function ProfileSectionTitle({ icon, title }: { icon: SettingRowProps["icon"]; title: string }) {
  return (
    <div className="profile-section-title">
      <span><HugeiconsIcon icon={icon} size={18} /></span>
      <h2>{title}</h2>
    </div>
  )
}

function SettingPill({ icon, label, value }: Omit<SettingRowProps, "helper">) {
  return (
    <div className="setting-pill">
      <span><HugeiconsIcon icon={icon} size={18} /></span>
      <small>{label}</small>
      <strong>{value}</strong>
    </div>
  )
}

function SettingRow({
  action,
  helper,
  icon,
  label,
  value,
}: SettingRowProps & { action?: ReactNode }) {
  return (
    <div className="setting-row">
      <span className="setting-row-icon"><HugeiconsIcon icon={icon} size={18} /></span>
      <div>
        <strong>{label}</strong>
        <small>{helper}</small>
      </div>
      {action ?? <em>{value}</em>}
    </div>
  )
}

function getReminderValue(enabled: boolean, permission: NotificationSupportState) {
  if (permission === "unsupported") return "Unavailable"
  if (permission === "denied") return "Blocked"
  if (enabled && permission === "granted") return "On"
  return "Off"
}
