import { useEffect, useRef } from "react"

import type { FaceBox } from "@/lib/face-tracker"

/**
 * Smooth auto-framing for the mirror camera.
 *
 * Takes a detected face bounding box and computes a CSS `transform`
 * (translate + scale) that centres the face within the viewport with a
 * rubber-band‑smooth interpolation.
 */

export interface FrameState {
  /** CSS `transform` value to apply to the video element. */
  transform: string
  /** Current zoom factor (1 = no zoom). */
  zoom: number
  /** 0 → 1 fade‑in while the tracker warms up. */
  trackingAlpha: number
}

const MIN_ZOOM = 1.0
const MAX_ZOOM = 1.6
const LERP_SPEED = 0.07
const FADE_IN_SPEED = 0.04
const FADE_OUT_SPEED = 0.06

const ZERO: FrameState = {
  transform: "",
  zoom: 1,
  trackingAlpha: 0,
}

export function useFaceFramer(
  face: FaceBox | null,
  isDetected: boolean,
  containerWidth: number,
  containerHeight: number,
): FrameState {
  const stateRef = useRef({
    smoothX: 0.5,
    smoothY: 0.5,
    smoothZoom: 1,
    alpha: 0,
    hasEverDetected: false,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _lastTargetX: 0.5,
    _lastTargetY: 0.5,
  })

  const frameIdRef = useRef(0)

  // Reset alpha when detection stops for a while
  const lostTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const s = stateRef.current

    if (isDetected && face) {
      // Clear lost timer
      if (lostTimerRef.current) {
        clearTimeout(lostTimerRef.current)
        lostTimerRef.current = null
      }

      s.hasEverDetected = true
      s._lastTargetX = face.x
      s._lastTargetY = face.y

      // Target zoom: bigger zoom when the face is small
      const faceSize = Math.max(face.width, face.height)
      const targetZoom = MIN_ZOOM + (1 - Math.min(1, faceSize / 0.4)) * (MAX_ZOOM - MIN_ZOOM)
      s.smoothZoom += LERP_SPEED * (targetZoom - s.smoothZoom)

      // Smoothly move toward face centre
      s.smoothX += LERP_SPEED * (face.x - s.smoothX)
      s.smoothY += LERP_SPEED * (face.y - s.smoothY)

      // Fade in tracking indicator
      s.alpha = Math.min(1, s.alpha + FADE_IN_SPEED)
    } else {
      // No face — gradually drift back to centre
      s.smoothX += LERP_SPEED * (0.5 - s.smoothX)
      s.smoothY += LERP_SPEED * (0.5 - s.smoothY)
      s.smoothZoom += LERP_SPEED * (1 - s.smoothZoom)

      // Fade out after a short delay
      if (s.hasEverDetected && s.alpha > 0 && !lostTimerRef.current) {
        lostTimerRef.current = setTimeout(() => {
          s.alpha = Math.max(0, s.alpha - FADE_OUT_SPEED)
          lostTimerRef.current = null
        }, 600)
      } else if (!s.hasEverDetected) {
        s.alpha = 0
      }
    }
  }, [face, isDetected])

  // Idle loop to keep the frame state updated (even when face doesn't change)
  const resultRef = useRef<FrameState>(ZERO)

  useEffect(() => {
    let running = true

    const tick = () => {
      if (!running) return

      const s = stateRef.current
      const cw = containerWidth || window.innerWidth
      const ch = containerHeight || window.innerHeight

      // Clamp zoom
      const zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, s.smoothZoom))

      // Translate: map face centre [0,1] to a pixel offset
      // At zoom=1, translate(0,0) shows the centre of the video.
      // When the face is at 0.75, we translate to bring that point to centre.
      const tx = (0.5 - s.smoothX) * cw * (zoom / 1.2)
      const ty = (0.5 - s.smoothY) * ch * (zoom / 1.2)

      // ScaleX(-1) for mirror effect is always kept; we append our pan & zoom
      resultRef.current = {
        transform: `scaleX(-1) scale(${zoom}) translate(${tx}px, ${ty}px)`,
        zoom,
        trackingAlpha: s.alpha,
      }

      frameIdRef.current = requestAnimationFrame(tick)
    }

    frameIdRef.current = requestAnimationFrame(tick)

    return () => {
      running = false
      cancelAnimationFrame(frameIdRef.current)
    }
  }, [containerWidth, containerHeight])

  return resultRef.current
}
