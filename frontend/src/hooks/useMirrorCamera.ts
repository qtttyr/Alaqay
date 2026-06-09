import { useCallback, useEffect, useRef, useState } from "react"

type CameraStatus = "idle" | "requesting" | "ready" | "denied" | "unsupported" | "error"

export function useMirrorCamera(enabled: boolean) {
  const streamRef = useRef<MediaStream | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<CameraStatus>("idle")

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
  }, [])

  const start = useCallback(async () => {
    if (!enabled) return null

    if (!("mediaDevices" in navigator) || !navigator.mediaDevices.getUserMedia) {
      setStatus("unsupported")
      setError("Camera is not available on this device.")
      return null
    }

    setStatus("requesting")
    setError(null)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: "user",
          height: { ideal: 1280 },
          width: { ideal: 720 },
        },
      })

      streamRef.current = stream
      setStatus("ready")
      return stream
    } catch (err) {
      const nextStatus = err instanceof DOMException && err.name === "NotAllowedError" ? "denied" : "error"
      setStatus(nextStatus)
      setError(nextStatus === "denied" ? "Camera permission was blocked." : "Could not start the camera.")
      return null
    }
  }, [enabled])

  useEffect(() => {
    if (!enabled) {
      stop()
      setStatus("idle")
      return
    }

    void start()

    return stop
  }, [enabled, start, stop])

  return {
    error,
    start,
    status,
    stop,
    stream: streamRef.current,
  }
}
