import { HugeiconsIcon } from "@hugeicons/react"
import { Camera01Icon, CameraOff01Icon, CheckmarkCircle02Icon, PauseCircleIcon, PlayCircleIcon } from "@hugeicons/core-free-icons"
import { useEffect, useRef, type CSSProperties } from "react"

import { Button } from "@/components/ui/button"
import { useMirrorCamera } from "@/hooks/useMirrorCamera"

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
  const camera = useMirrorCamera(true)
  const sessionProgress = Math.round(((totalSeconds - remainingSeconds) / totalSeconds) * 100)
  const cameraReady = camera.status === "ready"

  useEffect(() => {
    if (!videoRef.current || !camera.stream) return
    videoRef.current.srcObject = camera.stream
  }, [camera.stream, camera.status])

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
      <section className="brush-mirror-stage" data-camera={cameraReady ? "ready" : "fallback"}>
        {cameraReady && (
          <video
            ref={videoRef}
            aria-label="Mirror camera"
            autoPlay
            muted
            playsInline
          />
        )}

        {!cameraReady && (
          <div className="brush-camera-fallback">
            <HugeiconsIcon icon={camera.status === "requesting" ? Camera01Icon : CameraOff01Icon} size={30} />
            <strong>{getCameraTitle(camera.status)}</strong>
            <span>{camera.error ?? "Alaqay will still guide your brushing zones."}</span>
          </div>
        )}

        <div className="mirror-face-guide" aria-hidden="true">
          <span className={`mirror-zone upper ${isZoneActive(activeZone.id, "upper") ? "active" : ""}`} />
          <span className={`mirror-zone lower ${isZoneActive(activeZone.id, "lower") ? "active" : ""}`} />
          <span className={`mirror-zone left ${activeZone.id === "left-side" ? "active" : ""}`} />
          <span className={`mirror-zone right ${activeZone.id === "right-side" ? "active" : ""}`} />
        </div>

        <div className="mirror-topbar">
          <span>{formatTime(remainingSeconds)}</span>
          <strong>{activeZone.label}</strong>
          <em>{sessionProgress}%</em>
        </div>

        <div className="mirror-instruction">
          <strong>{getZoneInstruction(activeZone.id)}</strong>
          <span>Small circles. Light pressure.</span>
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
  if (zoneId.includes("upper")) return "Brush the upper teeth"
  if (zoneId.includes("lower")) return "Brush the lower teeth"
  if (zoneId === "left-side") return "Move to the left side"
  if (zoneId === "right-side") return "Move to the right side"
  return "Follow the highlighted zone"
}

function isZoneActive(zoneId: string, family: "upper" | "lower") {
  return zoneId.includes(family)
}
