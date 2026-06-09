import { HugeiconsIcon } from "@hugeicons/react"
import type { ComponentProps, ReactNode } from "react"
import { useState } from "react"
import {
  Camera01Icon,
  Clock01Icon,
  Edit02Icon,
  Logout03Icon,
  Moon02Icon,
  Notification02Icon,
  Settings02Icon,
  ShieldUserIcon,
  Sun01Icon,
  UserCircleIcon,
  VibrateIcon,
  VolumeHighIcon,
} from "@hugeicons/core-free-icons"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { NotificationSupportState } from "@/lib/notifications"
import { TimeDrumPicker } from "@/components/ui/TimeDrumPicker"

type SettingRowProps = {
  helper: string
  icon: ComponentProps<typeof HugeiconsIcon>["icon"]
  label: string
  value: string
}

type RoutineCardProps = {
  brushDuration: number
  eveningTime: string
  isSaving: boolean
  morningTime: string
  onBrushDurationChange: (value: number) => void
  onEveningTimeChange: (value: string) => void
  onMorningTimeChange: (value: string) => void
  onSave: () => void
}

const DURATION_OPTIONS = [90, 120, 180] as const

type ProfileDetailsCardProps = {
  displayName: string
  isSaving: boolean
  onDisplayNameChange: (value: string) => void
  onSave: () => void
}

type AccountCardProps = {
  email: string
  error: string | null
  isSigningOut: boolean
  onSignOut: () => void
}

type PermissionsCardProps = {
  hapticEnabled: boolean
  isSaving: boolean
  notificationsEnabled: boolean
  onToggleHaptic: () => void
  onToggleNotifications: () => void
  onToggleSound: () => void
  permission: NotificationSupportState
  soundEnabled: boolean
}

export function ProfileDetailsCard({
  displayName,
  isSaving,
  onDisplayNameChange,
  onSave,
}: ProfileDetailsCardProps) {
  return (
    <section className="profile-card">
      <ProfileSectionTitle icon={Edit02Icon} title="Personal details" />
      <label className="profile-field">
        <span>Name</span>
        <Input
          maxLength={32}
          value={displayName}
          onChange={(event) => onDisplayNameChange(event.target.value)}
          placeholder="Your name"
        />
      </label>
      <Button className="profile-save-button" onClick={onSave} disabled={isSaving}>
        {isSaving ? "Saving..." : "Save name"}
      </Button>
    </section>
  )
}

export function RoutineCard({
  brushDuration,
  eveningTime,
  isSaving,
  morningTime,
  onBrushDurationChange,
  onEveningTimeChange,
  onMorningTimeChange,
  onSave,
}: RoutineCardProps) {
  return (
    <section className="profile-card">
      <ProfileSectionTitle icon={Clock01Icon} title="Spark routine" />
      <div className="routine-settings-grid">
        <TimeSetting icon={Sun01Icon} label="Morning" value={morningTime} onChange={onMorningTimeChange} />
        <TimeSetting icon={Moon02Icon} label="Evening" value={eveningTime} onChange={onEveningTimeChange} />
      </div>
      <DurationSetting value={brushDuration} onChange={onBrushDurationChange} />
      <div className="routine-save-row">
        <small>Future Sparks follow this schedule.</small>
        <Button className="profile-save-button" onClick={onSave} disabled={isSaving}>
          {isSaving ? "Saving..." : "Save routine"}
        </Button>
      </div>
    </section>
  )
}

export function PermissionsCard({
  hapticEnabled,
  isSaving,
  notificationsEnabled,
  onToggleHaptic,
  onToggleNotifications,
  onToggleSound,
  permission,
  soundEnabled,
}: PermissionsCardProps) {
  const reminderValue = getReminderValue(notificationsEnabled, permission)

  return (
    <section className="profile-card">
      <ProfileSectionTitle icon={Settings02Icon} title="Comfort settings" />
      <div className="settings-rows">
        <SettingRow
          action={(
            <div className="setting-row-action">
              <em data-status={reminderValue.toLowerCase()}>{reminderValue}</em>
              <Button
                className="setting-row-button"
                size="sm"
                variant={notificationsEnabled ? "outline" : "default"}
                onClick={onToggleNotifications}
                disabled={isSaving || permission === "unsupported"}
              >
                {isSaving ? "Saving" : notificationsEnabled ? "Turn off" : "Enable"}
              </Button>
            </div>
          )}
          icon={Notification02Icon}
          label="Reminders"
          value={reminderValue}
          helper="Soft pushes around your Spark times."
        />
        <SettingRow
          action={(
            <div className="setting-row-action">
              <em>{soundEnabled ? "On" : "Off"}</em>
              <Button
                className="setting-row-button"
                size="sm"
                variant={soundEnabled ? "outline" : "default"}
                onClick={onToggleSound}
              >
                {soundEnabled ? "Turn off" : "Enable"}
              </Button>
            </div>
          )}
          icon={VolumeHighIcon}
          label="Sound"
          value={soundEnabled ? "On" : "Off"}
          helper="Gentle chimes when zones change."
        />
        <SettingRow
          action={(
            <div className="setting-row-action">
              <em>{hapticEnabled ? "On" : "Off"}</em>
              <Button
                className="setting-row-button"
                size="sm"
                variant={hapticEnabled ? "outline" : "default"}
                onClick={onToggleHaptic}
              >
                {hapticEnabled ? "Turn off" : "Enable"}
              </Button>
            </div>
          )}
          icon={VibrateIcon}
          label="Vibration"
          value={hapticEnabled ? "On" : "Off"}
          helper="Subtle taps on zone changes."
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

function TimeSetting({
  icon,
  label,
  onChange,
  value,
}: Omit<SettingRowProps, "helper"> & { onChange: (value: string) => void }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <label className="setting-pill time-setting">
      <div className="time-setting-header">
        <span><HugeiconsIcon icon={icon} size={18} /></span>
        <small>{label}</small>
      </div>
      <button type="button" className="time-drum-button" onClick={() => setIsOpen(true)}>
        {value}
      </button>
      {isOpen && (
        <TimeDrumPicker
          value={value}
          onChange={(next) => {
            onChange(next)
            setIsOpen(false)
          }}
          onClose={() => setIsOpen(false)}
        />
      )}
    </label>
  )
}

function DurationSetting({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="duration-setting">
      <div className="duration-setting-header">
        <span><HugeiconsIcon icon={Clock01Icon} size={14} /></span>
        <small>Brush duration</small>
      </div>
      <div className="duration-options">
        {DURATION_OPTIONS.map((option) => (
          <button
            key={option}
            type="button"
            className={`duration-pill${value === option ? " active" : ""}`}
            onClick={() => onChange(option)}
            aria-pressed={value === option}
          >
            <strong>{option}</strong>
            <small>s</small>
          </button>
        ))}
      </div>
      <small className="duration-hint">Each zone adjusts to your pace.</small>
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
