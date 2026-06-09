import { useCallback, useEffect, useMemo, useState } from "react"

import { brushApi } from "@/api/brushApi"
import { sparksApi, type SparkRecord } from "@/api/sparksApi"
import { useAuth } from "@/hooks/useAuth"

export type BrushZoneProgress = {
  id: string
  label: string
  progress: number
  secondsFrom: number
  secondsTo: number
}

const SESSION_SECONDS = 120

const zoneTemplate: Omit<BrushZoneProgress, "progress">[] = [
  { id: "upper-outside", label: "Upper outside", secondsFrom: 0, secondsTo: 20 },
  { id: "lower-outside", label: "Lower outside", secondsFrom: 20, secondsTo: 40 },
  { id: "left-side", label: "Left side", secondsFrom: 40, secondsTo: 60 },
  { id: "right-side", label: "Right side", secondsFrom: 60, secondsTo: 80 },
  { id: "upper-inside", label: "Upper inside", secondsFrom: 80, secondsTo: 100 },
  { id: "lower-inside", label: "Lower inside", secondsFrom: 100, secondsTo: 120 },
]

export function useBrushSession() {
  const { refreshAppData, user } = useAuth()
  const [elapsed, setElapsed] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [isLogged, setIsLogged] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [targetSpark, setTargetSpark] = useState<SparkRecord | null>(null)
  const [startedAt, setStartedAt] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      if (!user) return
      await sparksApi.ensureTodaySparks(user.id)
      const sparks = await sparksApi.getTodaySparks(user.id)
      if (!cancelled) setTargetSpark(selectTargetSpark(sparks))
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [user])

  useEffect(() => {
    if (!isRunning || isComplete) return

    const timer = window.setInterval(() => {
      setElapsed((value) => {
        const next = Math.min(value + 1, SESSION_SECONDS)
        if (next >= SESSION_SECONDS) {
          setIsRunning(false)
        }
        return next
      })
    }, 1000)

    return () => window.clearInterval(timer)
  }, [isComplete, isRunning])

  const zones = useMemo(() => buildZones(elapsed), [elapsed])
  const activeZone = zones.find((zone) => elapsed >= zone.secondsFrom && elapsed < zone.secondsTo) ?? zones[zones.length - 1]
  const remainingSeconds = Math.max(SESSION_SECONDS - elapsed, 0)

  const start = () => {
    setError(null)
    setStartedAt(new Date().toISOString())
    setIsComplete(false)
    setIsLogged(false)
    setElapsed(0)
    setIsRunning(true)
  }

  const pause = () => setIsRunning(false)
  const resume = () => setIsRunning(true)

  const markDone = useCallback(async () => {
    if (!user || !targetSpark || isLogged) return

    if (targetSpark.status === "done") {
      setIsLogged(true)
      setElapsed(SESSION_SECONDS)
      setIsComplete(true)
      setIsRunning(false)
      refreshAppData()
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      const zoneProgress = zonesToRecord(buildZones(SESSION_SECONDS))
      const completedSpark = await brushApi.completeBrushSession({
        durationSeconds: elapsed || SESSION_SECONDS,
        spark: targetSpark,
        startedAt: startedAt ?? new Date().toISOString(),
        userId: user.id,
        zoneProgress,
      })
      setTargetSpark(completedSpark)
      refreshAppData()
      setIsLogged(true)
      setElapsed(SESSION_SECONDS)
      setIsComplete(true)
      setIsRunning(false)
    } catch {
      setError("Could not save this Spark. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }, [elapsed, isLogged, refreshAppData, startedAt, targetSpark, user])

  useEffect(() => {
    if (elapsed >= SESSION_SECONDS && !isLogged && !isSaving && targetSpark && user) {
      void markDone()
    }
  }, [elapsed, isLogged, isSaving, markDone, targetSpark, user])

  return {
    activeZone,
    elapsed,
    error,
    isComplete,
    isPreparing: !targetSpark,
    isRunning,
    isSaving,
    markDone,
    pause,
    remainingSeconds,
    resume,
    start,
    targetSpark,
    totalSeconds: SESSION_SECONDS,
    zones,
  }
}

function selectTargetSpark(sparks: SparkRecord[]) {
  const hour = new Date().getHours()
  const preferred = hour < 15 ? "morning" : "evening"
  return sparks.find((spark) => spark.slot === preferred && spark.status !== "done")
    ?? sparks.find((spark) => spark.status !== "done")
    ?? sparks.find((spark) => spark.slot === preferred)
    ?? sparks[0]
    ?? null
}

function buildZones(elapsed: number): BrushZoneProgress[] {
  return zoneTemplate.map((zone) => {
    const zoneDuration = zone.secondsTo - zone.secondsFrom
    const zoneElapsed = Math.max(0, Math.min(elapsed - zone.secondsFrom, zoneDuration))
    return {
      ...zone,
      progress: Math.round((zoneElapsed / zoneDuration) * 100),
    }
  })
}

function zonesToRecord(zones: BrushZoneProgress[]) {
  return zones.reduce<Record<string, number>>((record, zone) => {
    record[zone.id] = zone.progress
    return record
  }, {})
}
