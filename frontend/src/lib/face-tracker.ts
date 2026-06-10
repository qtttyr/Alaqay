/**
 * Face detection engine.
 *
 * Uses the native FaceDetector API (Chromium) when available, falling back
 * to a lightweight Canvas-based tracker that combines motion detection
 * and brightness cues.
 *
 * All returned coordinates are normalised [0…1] relative to the video
 * dimensions so the consumer never needs to know the raw resolution.
 */

/* ── Type declarations for the native FaceDetector API ────────────── */

declare class FaceDetector {
  constructor(options?: FaceDetectorOptions)
  detect(image: ImageBitmapSource): Promise<DetectedFace[]>
}

interface FaceDetectorOptions {
  maxDetectedFaces?: number
  fastMode?: boolean
}

interface DetectedFace {
  boundingBox: DOMRectReadOnly
  landmarks?: Array<{ type: string; locations: DOMPointReadOnly[] }>
}

/* ── Exports ────────────────────────────────────────────────────── */

export interface FaceBox {
  /** Normalised centre-x of the detected face (0 = left, 1 = right). */
  x: number
  /** Normalised centre-y (0 = top, 1 = bottom). */
  y: number
  /** Normalised width of the bounding box. */
  width: number
  /** Normalised height of the bounding box. */
  height: number
}

export type FaceEngine = "native" | "canvas" | "none"
export type FaceCallback = (face: FaceBox | null, engine: FaceEngine) => void

/* ── Constants ──────────────────────────────────────────────────── */

const SCAN_INTERVAL_MS = 400
const CANVAS_W = 64
const CANVAS_H = 48

/** Check whether the browser supports the native FaceDetector API. */
export function hasNativeDetector(): boolean {
  try {
    return typeof window !== "undefined" && "FaceDetector" in window
  } catch {
    return false
  }
}

/* ── Canvas-based fallback ──────────────────────────────────────── */

/**
 * Simple motion + brightness centroid tracker.
 *
 * Every frame (at SCAN_INTERVAL_MS):
 * 1. Downscale video to CANVAS_W × CANVAS_H
 * 2. Convert to greyscale
 * 3. Compare with previous frame → motion map
 * 4. Find the centroid of the motion + bright regions
 * 5. Smooth with EMA and return a box
 *
 * This is deliberately simple — it just needs a "where is the person"
 * signal, not exact face landmarks.  It works in ANY browser.
 */
class CanvasFaceDetector {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private prevFrame: Uint8Array | null = null
  private smoothX = 0.5
  private smoothY = 0.5

  constructor() {
    this.canvas = document.createElement("canvas")
    this.canvas.width = CANVAS_W
    this.canvas.height = CANVAS_H
    const ctx = this.canvas.getContext("2d", { willReadFrequently: true })
    if (!ctx) throw new Error("Cannot create 2D context")
    this.ctx = ctx
  }

  detect(video: HTMLVideoElement): FaceBox | null {
    const vw = video.videoWidth
    const vh = video.videoHeight
    if (!vw || !vh) return null

    // Draw downscaled frame
    this.ctx.drawImage(video, 0, 0, CANVAS_W, CANVAS_H)
    const imageData = this.ctx.getImageData(0, 0, CANVAS_W, CANVAS_H)
    const pixels = imageData.data

    // Convert to greyscale + find brightness stats
    const grey = new Uint8Array(CANVAS_W * CANVAS_H)
    let sumBright = 0
    let sumWeight = 0
    let weightedX = 0
    let weightedY = 0

    for (let i = 0; i < CANVAS_W * CANVAS_H; i++) {
      const idx = i << 2
      // Luminance: 0.299R + 0.587G + 0.114B
      grey[i] = (pixels[idx] * 77 + pixels[idx + 1] * 150 + pixels[idx + 2] * 29) >> 8
    }

    // ── Motion score (frame differencing) ────────────────────────
    let motionScoreTotal = 0
    if (this.prevFrame) {
      for (let i = 0; i < CANVAS_W * CANVAS_H; i++) {
        const diff = Math.abs(grey[i] - this.prevFrame[i])
        // Anything above a tiny threshold counts as "motion"
        if (diff > 8) motionScoreTotal++
      }
    }
    this.prevFrame = grey

    // ── If there's enough motion, weight by brightness ──────────
    //     (the face is likely the brightest moving object)
    const motionRatio = motionScoreTotal / (CANVAS_W * CANVAS_H)

    // Thresholds — deliberately low to catch more
    if (motionRatio > 0.02) {
      // Motion detected — weight by brightness * motion
      for (let i = 0; i < CANVAS_W * CANVAS_H; i++) {
        // Brightness score: higher = brighter
        const bright = grey[i] / 255
        // Motion indicator: 1 if pixel changed, 0.3 if not
        let motion = 0.3
        if (this.prevFrame) {
          const diff = Math.abs(grey[i] - this.prevFrame[i])
          motion = Math.min(1, diff / 30)
        }
        const w = bright * motion

        sumBright += grey[i]
        sumWeight += w
        weightedX += (i % CANVAS_W) * w
        weightedY += ((i / CANVAS_W) | 0) * w
      }

      // Gentle pull toward center to avoid edge-seeking
      const cx = CANVAS_W / 2
      const cy = CANVAS_H / 2
      const centerPull = 0.15
      if (sumWeight > 0) {
        const rawX = weightedX / sumWeight
        const rawY = weightedY / sumWeight
        weightedX = rawX + (cx - rawX) * centerPull
        weightedY = rawY + (cy - rawY) * centerPull
      }
    } else {
      // No significant motion — fall back to brightness centroid
      // (person is still, just track the brightest area)
      let brightTotal = 0
      for (let i = 0; i < CANVAS_W * CANVAS_H; i++) {
        const bright = grey[i]
        sumBright += bright
        if (bright > 60) {
          weightedX += (i % CANVAS_W) * bright
          weightedY += ((i / CANVAS_W) | 0) * bright
          brightTotal += bright
        }
      }

      if (brightTotal > 0) {
        weightedX /= brightTotal
        weightedY /= brightTotal
      } else {
        // Nothing found — drift to centre
        weightedX = CANVAS_W / 2
        weightedY = CANVAS_H / 2
      }
    }

    // ── Normalise and smooth ─────────────────────────────────────
    const normX = weightedX / CANVAS_W
    const normY = weightedY / CANVAS_H

    // EMA smoothing (lower alpha = smoother)
    const alpha = 0.3
    this.smoothX = this.smoothX + alpha * (normX - this.smoothX)
    this.smoothY = this.smoothY + alpha * (normY - this.smoothY)

    // Heuristic box size: face is roughly 15-30% of the frame
    const brightnessRatio = sumBright / (CANVAS_W * CANVAS_H * 255)
    const size = 0.18 + brightnessRatio * 0.2

    return {
      x: Math.max(0.05, Math.min(0.95, this.smoothX)),
      y: Math.max(0.05, Math.min(0.95, this.smoothY)),
      width: size,
      height: size * (CANVAS_H / CANVAS_W),
    }
  }
}

/* ── Native FaceDetector API wrapper ────────────────────────────── */

async function nativeDetect(
  video: HTMLVideoElement,
  detector: FaceDetector,
): Promise<FaceBox | null> {
  try {
    const faces = await detector.detect(video)
    if (!faces || faces.length === 0) return null

    // Use the largest face
    let best = faces[0]
    let bestArea = best.boundingBox.width * best.boundingBox.height
    for (let i = 1; i < faces.length; i++) {
      const area = faces[i].boundingBox.width * faces[i].boundingBox.height
      if (area > bestArea) {
        best = faces[i]
        bestArea = area
      }
    }

    const bb = best.boundingBox
    const vw = video.videoWidth
    const vh = video.videoHeight
    if (!vw || !vh) return null

    const padding = 0.06
    const x = Math.max(0, bb.x / vw)
    const y = Math.max(0, bb.y / vh)
    const w = Math.min(1 - x, bb.width / vw)
    const h = Math.min(1 - y, bb.height / vh)

    return {
      x: x + w / 2,
      y: y + h / 2,
      width: w + padding * 2,
      height: h + padding * 2,
    }
  } catch {
    return null
  }
}

/* ── Tracker class ──────────────────────────────────────────────── */

export class FaceTracker {
  private video: HTMLVideoElement
  private detector: FaceDetector | null = null
  private canvasDetector: CanvasFaceDetector
  private engine: FaceEngine = "none"
  private timerId: ReturnType<typeof setInterval> | null = null
  private callback: FaceCallback
  private useNative: boolean

  constructor(video: HTMLVideoElement, callback: FaceCallback) {
    this.video = video
    this.callback = callback
    this.canvasDetector = new CanvasFaceDetector()
    this.useNative = hasNativeDetector()
  }

  start() {
    if (this.useNative) {
      try {
        this.detector = new FaceDetector({
          maxDetectedFaces: 1,
          fastMode: true,
        })
        this.engine = "native"
      } catch {
        this.useNative = false
      }
    }

    if (!this.useNative) {
      this.engine = "canvas"
    }

    this.timerId = setInterval(() => this.tick(), SCAN_INTERVAL_MS)
  }

  stop() {
    if (this.timerId !== null) {
      clearInterval(this.timerId)
      this.timerId = null
    }
    this.detector = null
  }

  private tick() {
    if (this.video.readyState < 2) {
      return
    }

    if (this.useNative && this.detector) {
      nativeDetect(this.video, this.detector).then((result) => {
        const face = result ?? this.fallback()
        this.callback(face, this.engine)
        this.exposeDebug(face)
      })
      return
    }

    // Canvas fallback
    try {
      const face = this.canvasDetector.detect(this.video)
      this.callback(face, this.engine)
      this.exposeDebug(face)
    } catch {
      this.callback(null, this.engine)
    }
  }

  /**
   * If native detection fails to find a face, fall back to canvas
   * so that the user still gets smooth framing.
   */
  private fallback(): FaceBox | null {
    return this.canvasDetector.detect(this.video)
  }

  /** Expose debug info on `window.__alaqay` for mobile console inspection. */
  private exposeDebug(face: FaceBox | null) {
    if (typeof window !== "undefined") {
      const d = (window as any).__alaqay ?? {}
      d.faceTracker = { engine: this.engine, face, tick: Date.now() }
      ;(window as any).__alaqay = d
    }
  }
}
