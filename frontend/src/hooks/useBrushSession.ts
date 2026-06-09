import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import { brushApi } from "@/api/brushApi"
import { sparksApi, type SparkRecord } from "@/api/sparksApi"
import { audioService } from "@/lib/audio"
import { useAuth } from "@/hooks/useAuth"

export type BrushZoneProgress = {
  id: string
  label: string
  progress: number
  secondsFrom: number
  secondsTo: number
}

const ZONE_DEFS: Array<{ id: string; label: string }> = [
  { id: "upper-outside", label: "Upper outside" },
  { id: "lower-outside", label: "Lower outside" },
  { id: "left-side", label: "Left side" },
  { id: "right-side", label: "Right side" },
  { id: "upper-inside", label: "Upper inside" },
  { id: "lower-inside", label: "Lower inside" },
]

const DEFAULT_DURATION = 120

function buildZoneIntervals(duration: number): Omit<BrushZoneProgress, "progress">[] {
  const zoneCount = ZONE_DEFS.length
  const zoneDuration = duration / zoneCount
  return ZONE_DEFS.map((def, i) => ({
    ...def,
    secondsFrom: i * zoneDuration,
    secondsTo: (i + 1) * zoneDuration,
  }))
}

export function useBrushSession() {
  const { profile, refreshAppData, user } = useAuth()
  const [elapsed, setElapsed] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [isLogged, setIsLogged] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [targetSpark, setTargetSpark] = useState<SparkRecord | null>(null)
  const [startedAt, setStartedAt] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const sessionDuration = profile?.brush_duration ?? DEFAULT_DURATION
  const zoneIntervals = useMemo(() => buildZoneIntervals(sessionDuration), [sessionDuration])

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
        const next = Math.min(value + 1, sessionDuration)
        if (next >= sessionDuration) {
          setIsRunning(false)
        }
        return next
      })
    }, 1000)

    return () => window.clearInterval(timer)
  }, [isComplete, isRunning, sessionDuration])

  const zones = useMemo(() => buildZones(elapsed, zoneIntervals), [elapsed, zoneIntervals])
  const activeZone = zones.find((zone) => elapsed >= zone.secondsFrom && elapsed < zone.secondsTo) ?? zones[zones.length - 1]
  const remainingSeconds = Math.max(sessionDuration - elapsed, 0)

  // ── Sync audio preferences from profile ────────────────────────────────
  useEffect(() => {
    // Default to enabled — user can toggle in settings
    audioService.setSoundEnabled(profile?.sound_enabled ?? true)
    audioService.setHapticEnabled(profile?.haptic_enabled ?? true)
  }, [profile?.sound_enabled, profile?.haptic_enabled])

  // ── Zone-change chime + haptic ──────────────────────────────────────────
  const prevZoneId = useRef(activeZone.id)
  useEffect(() => {
    if (prevZoneId.current !== activeZone.id) {
      audioService.playZoneChime()
      audioService.hapticZoneChange()
      prevZoneId.current = activeZone.id
    }
  }, [activeZone.id])

  // ── Session-complete fanfare ────────────────────────────────────────────
  const didCompleteRef = useRef(false)
  useEffect(() => {
    if (isComplete && !didCompleteRef.current) {
      didCompleteRef.current = true
      audioService.playSessionComplete()
      audioService.hapticComplete()
    }
    if (!isComplete) {
      didCompleteRef.current = false
    }
  }, [isComplete])

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
      setElapsed(sessionDuration)
      setIsComplete(true)
      setIsRunning(false)
      refreshAppData()
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      const zoneProgress = zonesToRecord(buildZones(sessionDuration, zoneIntervals))
      const completedSpark = await brushApi.completeBrushSession({
        durationSeconds: elapsed || sessionDuration,
        spark: targetSpark,
        startedAt: startedAt ?? new Date().toISOString(),
        userId: user.id,
        zoneProgress,
      })
      setTargetSpark(completedSpark)
      refreshAppData()
      setIsLogged(true)
      setElapsed(sessionDuration)
      setIsComplete(true)
      setIsRunning(false)
    } catch {
      setError("Could not save this Spark. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }, [elapsed, isLogged, refreshAppData, sessionDuration, startedAt, targetSpark, user, zoneIntervals])

  useEffect(() => {
    if (elapsed >= sessionDuration && !isLogged && !isSaving && targetSpark && user) {
      void markDone()
    }
  }, [elapsed, isLogged, isSaving, markDone, sessionDuration, targetSpark, user])

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
    totalSeconds: sessionDuration,
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

function buildZones(elapsed: number, zoneIntervals: Omit<BrushZoneProgress, "progress">[]): BrushZoneProgress[] {
  return zoneIntervals.map((zone) => {
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
