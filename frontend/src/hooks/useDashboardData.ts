import { useEffect, useMemo, useState } from "react"

import { sparksApi, toDateKey, type SparkRecord, type SparkSlotId } from "@/api/sparksApi"
import { profile as mockProfile } from "@/data/alaqayMock"
import { useAuth } from "@/hooks/useAuth"
import type { SparkSlot, SparkStatus, WeekSpark } from "@/types/alaqay"

type DashboardData = {
  displayName: string
  eveningTime: string
  isLoading: boolean
  sparkSlots: SparkSlot[]
  streak: number
  totalSparks: number
  weekSparks: WeekSpark[]
}

export function useDashboardData(): DashboardData {
  const { dataVersion, profile, user } = useAuth()
  const [todaySparks, setTodaySparks] = useState<SparkRecord[]>([])
  const [rangeSparks, setRangeSparks] = useState<SparkRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      if (!user) return
      setIsLoading(true)
      const end = new Date()
      const start = addDays(end, -13)

      try {
        await sparksApi.ensureTodaySparks(user.id)
        const [today, range] = await Promise.all([
          sparksApi.getTodaySparks(user.id),
          sparksApi.getSparksRange(user.id, toDateKey(start), toDateKey(end)),
        ])

        if (!cancelled) {
          setTodaySparks(today)
          setRangeSparks(range)
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [dataVersion, user])

  return useMemo(() => {
    const morningTime = formatTime(profile?.morning_time ?? mockProfile.morningTime)
    const eveningTime = formatTime(profile?.evening_time ?? mockProfile.eveningTime)
    const displayName = profile?.username || user?.user_metadata?.username || user?.email?.split("@")[0] || mockProfile.name

    return {
      displayName,
      eveningTime,
      isLoading,
      sparkSlots: buildSparkSlots(todaySparks, morningTime, eveningTime),
      streak: calculateStreak(rangeSparks),
      totalSparks: rangeSparks.filter((spark) => spark.status === "done").length,
      weekSparks: buildWeekSparks(rangeSparks),
    }
  }, [isLoading, profile, rangeSparks, todaySparks, user])
}

function buildSparkSlots(records: SparkRecord[], morningTime: string, eveningTime: string): SparkSlot[] {
  return [
    toSparkSlot("morning", "Morning Spark", morningTime, records.find((spark) => spark.slot === "morning")),
    toSparkSlot("evening", "Evening Spark", eveningTime, records.find((spark) => spark.slot === "evening")),
  ]
}

function toSparkSlot(id: SparkSlotId, title: string, time: string, record?: SparkRecord): SparkSlot {
  const status = getDisplayStatus(id, time, record?.status ?? "upcoming")

  return {
    id,
    title,
    time,
    status,
    progress: status === "done" ? 100 : status === "active" ? 42 : 0,
    note: "",
  }
}

function buildWeekSparks(records: SparkRecord[]): WeekSpark[] {
  return Array.from({ length: 7 }, (_, index) => {
    const date = addDays(new Date(), index - 6)
    const dateKey = toDateKey(date)
    const dayRecords = records.filter((spark) => spark.date === dateKey)

    return {
      day: date.toLocaleDateString("en", { weekday: "short" }),
      morning: dayRecords.find((spark) => spark.slot === "morning")?.status ?? "upcoming",
      evening: dayRecords.find((spark) => spark.slot === "evening")?.status ?? "upcoming",
    }
  })
}

function calculateStreak(records: SparkRecord[]) {
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

function getDisplayStatus(slot: SparkSlotId, time: string, status: SparkStatus): SparkStatus {
  if (status === "done" || status === "missed") return status

  const now = new Date()
  const [hours, minutes] = time.split(":").map(Number)
  const target = new Date()
  target.setHours(hours, minutes, 0, 0)

  if (slot === "morning" && now.getHours() >= 12) return "missed"
  if (slot === "evening" && now.getHours() >= 23) return "missed"

  const minutesUntil = (target.getTime() - now.getTime()) / 60000
  return minutesUntil <= 90 ? "active" : "upcoming"
}

function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setDate(date.getDate() + days)
  return next
}

function formatTime(value: string) {
  return value.slice(0, 5)
}
