import { sparksApi, type SparkRecord } from "@/api/sparksApi"
import { supabase } from "@/lib/supabase"

type CompleteBrushSessionInput = {
  durationSeconds: number
  spark: SparkRecord
  startedAt: string
  userId: string
  zoneProgress: Record<string, number>
}

export const brushApi = {
  async completeBrushSession({
    durationSeconds,
    spark,
    startedAt,
    userId,
    zoneProgress,
  }: CompleteBrushSessionInput) {
    const completedSpark = await sparksApi.completeSpark(spark.id, durationSeconds, zoneProgress)

    const { error } = await supabase.from("user_sessions").insert({
      completed: true,
      duration_seconds: durationSeconds,
      ended_at: new Date().toISOString(),
      spark_id: spark.id,
      started_at: startedAt,
      user_id: userId,
      zone_data: zoneProgress,
    })

    if (error) throw error
    return completedSpark
  },
}
