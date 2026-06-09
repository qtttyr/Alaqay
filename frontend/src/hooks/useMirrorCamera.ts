import { useCallback, useEffect, useRef, useState } from "react"

type CameraStatus = "idle" | "requesting" | "ready" | "denied" | "unsupported" | "error"

export function useMirrorCamera(enabled: boolean) {
  const [stream, setStream] = useState<MediaStream | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<CameraStatus>("idle")

  const stop = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    setStream(null)
    setStatus("idle")
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
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: "user",
          height: { ideal: 1280 },
          width: { ideal: 720 },
        },
      })

      streamRef.current = mediaStream
      setStream(mediaStream)
      setStatus("ready")
      return mediaStream
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
    stream,
  }
}
