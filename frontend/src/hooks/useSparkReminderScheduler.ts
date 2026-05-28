import { useEffect } from "react"

import { sparksApi, toDateKey, type SparkSlotId } from "@/api/sparksApi"
import { useAuth } from "@/hooks/useAuth"
import { notificationService } from "@/lib/notifications"

const REMINDER_WINDOW_MINUTES = 90
const REMINDER_CHECK_MS = 60_000

type DueSpark = {
  dateKey: string
  slot: SparkSlotId
  time: string
}

export function useSparkReminderScheduler() {
  const { isAuthenticated, isOnboardingComplete, profile, user } = useAuth()

  useEffect(() => {
    if (!isAuthenticated || !isOnboardingComplete || !profile || !user) return
    if (!profile.notifications_enabled || notificationService.getPermission() !== "granted") return

    let cancelled = false

    const checkReminder = async () => {
      const dueSpark = getDueSpark(profile.morning_time, profile.evening_time)
      if (!dueSpark) return

      const storageKey = getReminderStorageKey(user.id, dueSpark)
      if (window.localStorage.getItem(storageKey)) return

      try {
        await sparksApi.ensureTodaySparks(user.id)
        const sparks = await sparksApi.getTodaySparks(user.id)
        const spark = sparks.find((item) => item.slot === dueSpark.slot)
        if (cancelled) return

        if (spark?.status === "done") {
          window.localStorage.setItem(storageKey, "done")
          return
        }

        await notificationService.showSparkReminder(dueSpark)
        window.localStorage.setItem(storageKey, new Date().toISOString())
      } catch {
        // Reminder checks should never block the app shell.
      }
    }

    void checkReminder()
    const interval = window.setInterval(checkReminder, REMINDER_CHECK_MS)

    return () => {
      cancelled = true
      window.clearInterval(interval)
    }
  }, [
    isAuthenticated,
    isOnboardingComplete,
    profile,
    profile?.evening_time,
    profile?.morning_time,
    profile?.notifications_enabled,
    user,
  ])
}

function getDueSpark(morningTime: string, eveningTime: string): DueSpark | null {
  const now = new Date()
  const dateKey = toDateKey(now)
  const slots: Array<{ slot: SparkSlotId; time: string }> = [
    { slot: "morning", time: morningTime },
    { slot: "evening", time: eveningTime },
  ]

  const dueSlot = slots.find(({ time }) => isInsideReminderWindow(now, time))
  return dueSlot ? { dateKey, ...dueSlot } : null
}

function isInsideReminderWindow(now: Date, time: string) {
  const [hours, minutes] = time.slice(0, 5).split(":").map(Number)
  const target = new Date(now)
  target.setHours(hours, minutes, 0, 0)

  const diffMinutes = (now.getTime() - target.getTime()) / 60000
  return diffMinutes >= 0 && diffMinutes <= REMINDER_WINDOW_MINUTES
}

function getReminderStorageKey(userId: string, spark: DueSpark) {
  return `alaqay:spark-reminder:${userId}:${spark.dateKey}:${spark.slot}`
}
