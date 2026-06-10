import { useCallback, useEffect, useRef, useState } from "react"

import { FaceTracker, type FaceBox, type FaceEngine, hasNativeDetector } from "@/lib/face-tracker"

export type { FaceBox, FaceEngine }

/**
 * Face detection hook.
 *
 * @param videoRef  Ref to the <video> element (must be mounted in DOM).
 * @param enabled   Only starts detection when `true`. Pass `cameraReady`
 *                  so the tracker starts only after the video stream is
 *                  attached and the element has rendered.
 */
export function useFaceDetection(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  enabled: boolean = true,
) {
  const [face, setFace] = useState<FaceBox | null>(null)
  const [isDetected, setIsDetected] = useState(false)
  const [engine, setEngine] = useState<FaceEngine>("none")
  const trackerRef = useRef<FaceTracker | null>(null)

  const onFace = useCallback((f: FaceBox | null, e: FaceEngine) => {
    setFace(f)
    setEngine(e)
    setIsDetected(f !== null)
  }, [])

  // Create / destroy the tracker when `enabled` or the video ref changes
  useEffect(() => {
    const video = videoRef.current
    if (!video || !enabled) {
      // Clean up if tracker exists but shouldn't
      if (trackerRef.current) {
        trackerRef.current.stop()
        trackerRef.current = null
      }
      return
    }

    // Wait for the video to have actual data before starting detection
    const tryStart = () => {
      if (video.readyState >= 2 && video.videoWidth > 0) {
        const tracker = new FaceTracker(video, onFace)
        trackerRef.current = tracker
        tracker.start()
      }
    }

    // If video is already ready, start immediately
    tryStart()

    // Otherwise wait for loadedmetadata or canplay
    const onReady = () => tryStart()
    video.addEventListener("loadedmetadata", onReady)
    video.addEventListener("canplay", onReady)

    return () => {
      video.removeEventListener("loadedmetadata", onReady)
      video.removeEventListener("canplay", onReady)
      if (trackerRef.current) {
        trackerRef.current.stop()
        trackerRef.current = null
      }
    }
  }, [videoRef, enabled, onFace])

  return { face, isDetected, engine, isNative: hasNativeDetector() }
}
