import { useCallback, useEffect, useRef, useState } from "react"

import { FaceTracker, type FaceBox, type FaceEngine, hasNativeDetector } from "@/lib/face-tracker"

export type { FaceBox, FaceEngine }

export function useFaceDetection(videoRef: React.RefObject<HTMLVideoElement | null>) {
  const [face, setFace] = useState<FaceBox | null>(null)
  const [isDetected, setIsDetected] = useState(false)
  const [engine, setEngine] = useState<FaceEngine>("none")
  const trackerRef = useRef<FaceTracker | null>(null)
  const isActiveRef = useRef(false)

  const onFace = useCallback((f: FaceBox | null, e: FaceEngine) => {
    setFace(f)
    setEngine(e)
    setIsDetected(f !== null)
  }, [])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    isActiveRef.current = true
    const tracker = new FaceTracker(video, onFace)
    trackerRef.current = tracker
    tracker.start()

    return () => {
      isActiveRef.current = false
      tracker.stop()
      trackerRef.current = null
    }
  }, [videoRef, onFace])

  return { face, isDetected, engine, isNative: hasNativeDetector() }
}
