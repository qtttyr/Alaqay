import { supabase } from "@/lib/supabase"
import type { SparkStatus } from "@/types/alaqay"

export type SparkSlotId = "morning" | "evening"

export type SparkRecord = {
  id: string
  user_id: string
  date: string
  slot: SparkSlotId
  status: SparkStatus
  completed_at: string | null
  duration_seconds: number | null
  zone_progress: Record<string, number> | null
  created_at: string
}

type SparkInsert = {
  date: string
  slot: SparkSlotId
  status: SparkStatus
  user_id: string
}

const sparksTable = supabase.from("sparks")

export const sparksApi = {
  async ensureTodaySparks(userId: string) {
    const { error: rpcError } = await supabase.rpc("ensure_today_sparks", { user_uuid: userId })

    if (!rpcError) return

    const today = toDateKey(new Date())
    const rows: SparkInsert[] = [
      { user_id: userId, date: today, slot: "morning", status: "upcoming" },
      { user_id: userId, date: today, slot: "evening", status: "upcoming" },
    ]

    const { error } = await sparksTable.upsert(rows, { onConflict: "user_id,date,slot" })
    if (error) throw error
  },

  async getTodaySparks(userId: string) {
    const today = toDateKey(new Date())
    const { data, error } = await sparksTable
      .select("*")
      .eq("user_id", userId)
      .eq("date", today)
      .order("slot")

    if (error) throw error
    return (data ?? []) as SparkRecord[]
  },

  async completeSpark(sparkId: string, durationSeconds: number, zoneProgress: Record<string, number>) {
    const { data, error } = await sparksTable
      .update({
        completed_at: new Date().toISOString(),
        duration_seconds: durationSeconds,
        status: "done",
        zone_progress: zoneProgress,
      })
      .eq("id", sparkId)
      .select()
      .single()

    if (error) throw error
    return data as SparkRecord
  },

  async getSparksRange(userId: string, startDate: string, endDate: string) {
    const { data, error } = await sparksTable
      .select("*")
      .eq("user_id", userId)
      .gte("date", startDate)
      .lte("date", endDate)
      .order("date")

    if (error) throw error
    return (data ?? []) as SparkRecord[]
  },
}

export function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10)
}
