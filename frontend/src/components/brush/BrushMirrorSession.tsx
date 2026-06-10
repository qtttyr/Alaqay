import { HugeiconsIcon } from "@hugeicons/react"
import { Camera01Icon, CameraOff01Icon, CheckmarkCircle02Icon, PauseCircleIcon, PlayCircleIcon } from "@hugeicons/core-free-icons"
import { useEffect, useRef, useState, type CSSProperties } from "react"

import { Button } from "@/components/ui/button"
import { FaceRing } from "@/components/ui/FaceRing"
import { useFaceDetection } from "@/hooks/useFaceDetection"
import { useFaceFramer } from "@/hooks/useFaceFramer"
import { useMirrorCamera } from "@/hooks/useMirrorCamera"

function TeethGuide({ activeZoneId }: { activeZoneId: string }) {
  const getStyle = (zoneId: string) => {
    const isActive = activeZoneId === zoneId
    return {
      fill: isActive ? "oklch(0.82 0.22 128)" : "rgba(255, 255, 255, 0.15)",
      stroke: isActive ? "oklch(0.92 0.22 128)" : "rgba(255, 255, 255, 0.3)",
      strokeWidth: isActive ? 2 : 1,
      filter: isActive ? "drop-shadow(0px 0px 6px oklch(0.82 0.22 128 / 0.8))" : "none",
      transition: "all 0.3s ease",
    }
  }

  return (
    <svg width="68" height="68" viewBox="0 0 100 100" className="teeth-guide-svg">
      {/* Upper Outside (Top Outer Arch) */}
      <path
        d="M 15,45 A 35,35 0 0,1 85,45"
        fill="none"
        stroke={activeZoneId === "upper-outside" ? "oklch(0.82 0.22 128)" : "rgba(255, 255, 255, 0.2)"}
        strokeWidth={activeZoneId === "upper-outside" ? "8" : "4"}
        strokeLinecap="round"
        style={{
          filter: activeZoneId === "upper-outside" ? "drop-shadow(0px 0px 8px oklch(0.82 0.22 128))" : "none",
          transition: "all 0.3s ease"
        }}
      />

      {/* Upper Inside (Top Inner Arch) */}
      <path
        d="M 25,48 A 25,25 0 0,1 75,48"
        fill="none"
        stroke={activeZoneId === "upper-inside" ? "oklch(0.82 0.22 128)" : "rgba(255, 255, 255, 0.2)"}
        strokeWidth={activeZoneId === "upper-inside" ? "8" : "4"}
        strokeLinecap="round"
        style={{
          filter: activeZoneId === "upper-inside" ? "drop-shadow(0px 0px 8px oklch(0.82 0.22 128))" : "none",
          transition: "all 0.3s ease"
        }}
      />

      {/* Lower Outside (Bottom Outer Arch) */}
      <path
        d="M 15,55 A 35,35 0 0,0 85,55"
        fill="none"
        stroke={activeZoneId === "lower-outside" ? "oklch(0.82 0.22 128)" : "rgba(255, 255, 255, 0.2)"}
        strokeWidth={activeZoneId === "lower-outside" ? "8" : "4"}
        strokeLinecap="round"
        style={{
          filter: activeZoneId === "lower-outside" ? "drop-shadow(0px 0px 8px oklch(0.82 0.22 128))" : "none",
          transition: "all 0.3s ease"
        }}
      />

      {/* Lower Inside (Bottom Inner Arch) */}
      <path
        d="M 25,52 A 25,25 0 0,0 75,52"
        fill="none"
        stroke={activeZoneId === "lower-inside" ? "oklch(0.82 0.22 128)" : "rgba(255, 255, 255, 0.2)"}
        strokeWidth={activeZoneId === "lower-inside" ? "8" : "4"}
        strokeLinecap="round"
        style={{
          filter: activeZoneId === "lower-inside" ? "drop-shadow(0px 0px 8px oklch(0.82 0.22 128))" : "none",
          transition: "all 0.3s ease"
        }}
      />

      {/* Left Side (Chewing Surfaces - Left Molars) */}
      <rect
        x="10"
        y="42"
        width="10"
        height="16"
        rx="4"
        style={getStyle("left-side")}
      />

      {/* Right Side (Chewing Surfaces - Right Molars) */}
      <rect
        x="80"
        y="42"
        width="10"
        height="16"
        rx="4"
        style={getStyle("right-side")}
      />
    </svg>
  )
}

type BrushMirrorZone = {
  id: string
  label: string
  progress: number
}

type BrushMirrorSessionProps = {
  activeZone: BrushMirrorZone
  error: string | null
  isRunning: boolean
  isSaving: boolean
  onDone: () => void
  onPause: () => void
  onResume: () => void
  remainingSeconds: number
  totalSeconds: number
  zones: BrushMirrorZone[]
}

export function BrushMirrorSession({
  activeZone,
  error,
  isRunning,
  isSaving,
  onDone,
  onPause,
  onResume,
  remainingSeconds,
  totalSeconds,
  zones,
}: BrushMirrorSessionProps) {
  const autoPausedRef = useRef(false)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const stageRef = useRef<HTMLDivElement | null>(null)
  const camera = useMirrorCamera(true)
  const sessionProgress = Math.round(((totalSeconds - remainingSeconds) / totalSeconds) * 100)
  const cameraReady = camera.status === "ready"

  // ── Face detection (works only when video is playing) ────────────────
  const { face, isDetected } = useFaceDetection(videoRef)

  // ── Container dimensions for auto-framing ────────────────────────────
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const el = stageRef.current
    if (!el) return

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        if (width > 0 && height > 0) {
          setStageSize({ width, height })
        }
      }
    })

    ro.observe(el)

    // Initial size
    const rect = el.getBoundingClientRect()
    if (rect.width > 0 && rect.height > 0) {
      setStageSize({ width: rect.width, height: rect.height })
    }

    return () => ro.disconnect()
  }, [])

  // ── Smooth auto-framing transform ────────────────────────────────────
  const frameState = useFaceFramer(face, isDetected, stageSize.width, stageSize.height)

  // ── Stream video to element ──────────────────────────────────────────
  useEffect(() => {
    const video = videoRef.current
    if (!video || !camera.stream) return

    video.defaultMuted = true
    video.muted = true
    video.srcObject = camera.stream

    const playPromise = video.play()
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        console.warn("Autoplay was prevented or video failed to play:", err)
      })
    }
  }, [camera.stream])

  // ── Auto-pause while camera is starting ──────────────────────────────
  useEffect(() => {
    if (camera.status === "requesting" && isRunning) {
      autoPausedRef.current = true
      onPause()
      return
    }

    if (autoPausedRef.current && camera.status !== "requesting" && !isRunning) {
      autoPausedRef.current = false
      onResume()
    }
  }, [camera.status, isRunning, onPause, onResume])

  return (
    <div className="brush-mirror-shell">
      <section
        className="brush-mirror-stage"
        ref={stageRef}
        data-camera={cameraReady ? "ready" : "fallback"}
        data-tracking={isDetected ? "face" : "idle"}
      >
        {cameraReady && (
          <div className="mirror-video-crop">
            <video
              ref={videoRef}
              aria-label="Mirror camera"
              autoPlay
              muted
              playsInline
              style={{ transform: frameState.transform } as CSSProperties}
              onLoadedMetadata={() => {
                videoRef.current?.play().catch(e => console.warn("Metadata play failed:", e))
              }}
            />
            {/* Face tracking ring overlay */}
            <FaceRing
              face={face}
              isDetected={isDetected}
              trackingAlpha={frameState.trackingAlpha}
              containerRef={stageRef}
            />
          </div>
        )}

        {!cameraReady && (
          <div className="brush-camera-fallback">
            <HugeiconsIcon icon={camera.status === "requesting" ? Camera01Icon : CameraOff01Icon} size={30} />
            <strong>{getCameraTitle(camera.status)}</strong>
            <span>{camera.error ?? "Alaqay will still guide your brushing zones."}</span>
          </div>
        )}

        {/* Static face guide — visible only when tracking is idle */}
        {!isDetected && <div className="mirror-face-guide" aria-hidden="true" />}

        <div className="mirror-hud-card" aria-label="Teeth Guide">
          <TeethGuide activeZoneId={activeZone.id} />
        </div>

        <div className="mirror-topbar">
          <span>{formatTime(remainingSeconds)}</span>
          <strong>{activeZone.label}</strong>
          <em>{sessionProgress}%</em>
        </div>

        <div className="mirror-instruction">
          <strong>{getZoneInstruction(activeZone.id)}</strong>
          <div className="rhythm-container">
            <span className="rhythm-dot" />
            <span>Small circles. Light pressure.</span>
          </div>
        </div>

        <div className="mirror-zone-strip" aria-label="Brush zones progress">
          {zones.map((zone) => (
            <span
              className={zone.id === activeZone.id ? "active" : zone.progress >= 100 ? "done" : ""}
              key={zone.id}
              style={{ "--zone-progress": `${zone.progress}%` } as CSSProperties}
              title={zone.label}
            />
          ))}
        </div>
      </section>

      <div className="brush-mirror-controls">
        <Button variant="outline" onClick={isRunning ? onPause : onResume}>
          <HugeiconsIcon icon={isRunning ? PauseCircleIcon : PlayCircleIcon} size={18} />
          {isRunning ? "Pause" : "Resume"}
        </Button>
        <Button className="primary-glow" onClick={onDone} disabled={isSaving}>
          <HugeiconsIcon icon={CheckmarkCircle02Icon} size={18} />
          {isSaving ? "Saving..." : "Finish"}
        </Button>
      </div>

      {(error || camera.error) && (
        <p className="brush-error">{error ?? camera.error}</p>
      )}
    </div>
  )
}

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60
  return `${minutes}:${rest.toString().padStart(2, "0")}`
}

function getCameraTitle(status: ReturnType<typeof useMirrorCamera>["status"]) {
  if (status === "requesting") return "Starting mirror"
  if (status === "denied") return "Camera blocked"
  if (status === "unsupported") return "Camera unavailable"
  return "Mirror preview"
}

function getZoneInstruction(zoneId: string) {
  if (zoneId === "upper-outside") return "Brush upper OUTSIDE surfaces"
  if (zoneId === "upper-inside") return "Brush upper INSIDE surfaces"
  if (zoneId === "lower-outside") return "Brush lower OUTSIDE surfaces"
  if (zoneId === "lower-inside") return "Brush lower INSIDE surfaces"
  if (zoneId === "left-side") return "Brush left chewing surfaces"
  if (zoneId === "right-side") return "Brush right chewing surfaces"
  return "Follow the highlighted zone"
}
