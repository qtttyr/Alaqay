import type { SparkSlotId } from "@/api/sparksApi"

export type NotificationSupportState = NotificationPermission | "unsupported"

type SparkReminderInput = {
  slot: SparkSlotId
  time: string
}

export const notificationService = {
  getPermission(): NotificationSupportState {
    if (!("Notification" in window)) return "unsupported"
    return Notification.permission
  },

  isSupported() {
    return "Notification" in window && "serviceWorker" in navigator
  },

  async requestPermission(): Promise<NotificationSupportState> {
    if (!("Notification" in window)) return "unsupported"
    return Notification.requestPermission()
  },

  async showSparkReminder({ slot, time }: SparkReminderInput) {
    if (this.getPermission() !== "granted") return

    const title = slot === "morning" ? "Morning Spark is ready" : "Evening Spark is ready"
    const body = `It is ${formatTime(time)}. Brush together or light your Spark.`
    const options: NotificationOptions = {
      body,
      data: { url: "/brush" },
      icon: "/favicon.svg",
      tag: `alaqay-${slot}-spark`,
    }

    const registration = await getReadyRegistration()

    if (registration) {
      await registration.showNotification(title, options)
      return
    }

    new Notification(title, options)
  },
}

function formatTime(value: string) {
  return value.slice(0, 5)
}

async function getReadyRegistration() {
  return Promise.race<ServiceWorkerRegistration | null>([
    navigator.serviceWorker.ready,
    new Promise<null>((resolve) => window.setTimeout(() => resolve(null), 1500)),
  ])
}
