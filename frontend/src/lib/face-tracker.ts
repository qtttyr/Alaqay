/**
 * Face detection engine.
 *
 * Uses the native FaceDetector API (Chromium) when available, falling back
 * to a lightweight Canvas-based tracker that combines motion detection,
 * brightness centroid, and skin-colour cues.  The CV fallback is designed
 * specifically for the mirror / bathroom scenario (person standing in front
 * of a fairly static background).
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

const SCAN_INTERVAL_MS = 350
const CANVAS_W = 80
const CANVAS_H = 60

/* ── Skin-colour range in YCbCr (loose, works for most skin tones) ──── */
const SKIN_Y_MIN = 60
const SKIN_CB = [85, 130] as const
const SKIN_CR = [133, 175] as const

/* ── State ──────────────────────────────────────────────────────────── */

interface TrackerState {
  prevFrame: ImageData | null
  smoothX: number
  smoothY: number
}

function createState(): TrackerState {
  return { prevFrame: null, smoothX: 0.5, smoothY: 0.5 }
}

/* ── Public helpers ─────────────────────────────────────────────────── */

/** Check whether the browser supports the native FaceDetector API. */
export function hasNativeDetector(): boolean {
  return typeof window !== "undefined" && "FaceDetector" in window
}

/* ── Canvas-based fallback ──────────────────────────────────────────── */

function canvasDetect(
  video: HTMLVideoElement,
  ctx: CanvasRenderingContext2D,
  state: TrackerState,
): FaceBox | null {
  const vw = video.videoWidth
  const vh = video.videoHeight
  if (!vw || !vh) return null

  // Draw a downscaled frame to the offscreen canvas
  ctx.drawImage(video, 0, 0, CANVAS_W, CANVAS_H)
  const imageData = ctx.getImageData(0, 0, CANVAS_W, CANVAS_H)
  const pixels = imageData.data

  const cx = CANVAS_W / 2
  const cy = CANVAS_H / 2

  // 1) Build a "confidence" map combining skin-colour, brightness & motion
  const confidences = new Float32Array(CANVAS_W * CANVAS_H)
  let totalWeight = 0
  let weightedX = 0
  let weightedY = 0
  let maxConf = 0
  let maxIdx = 0

  for (let i = 0; i < CANVAS_W * CANVAS_H; i++) {
    const idx = i << 2
    const r = pixels[idx]
    const g = pixels[idx + 1]
    const b = pixels[idx + 2]

    // Convert RGB → YCbCr
    const y = 0.299 * r + 0.587 * g + 0.114 * b
    const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b
    const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b

    // Skin-colour score (0‑1)
    const inSkinRange =
      y > SKIN_Y_MIN &&
      cb >= SKIN_CB[0] && cb <= SKIN_CB[1] &&
      cr >= SKIN_CR[0] && cr <= SKIN_CR[1]
    const skinScore = inSkinRange ? 1 : Math.max(0, 1 - Math.abs(cr - 154) / 60)

    // Brightness score – face is typically the brightest object in a mirror
    const brightScore = Math.min(1, y / 200)

    // Motion score – frame differencing
    let motionScore = 0.5
    if (state.prevFrame) {
      const prevIdx = idx
      const pd = state.prevFrame.data
      const diff =
        Math.abs(pixels[prevIdx] - pd[prevIdx]) +
        Math.abs(pixels[prevIdx + 1] - pd[prevIdx + 1]) +
        Math.abs(pixels[prevIdx + 2] - pd[prevIdx + 2])
      motionScore = Math.min(1, diff / (3 * 60))
    }

    // Combined confidence
    const conf = skinScore * 0.5 + brightScore * 0.25 + motionScore * 0.25
    confidences[i] = conf

    if (conf > maxConf) {
      maxConf = conf
      maxIdx = i
    }

    // Weighted centroid (penalise areas far from centre)
    const px = i % CANVAS_W
    const py = (i / CANVAS_W) | 0
    const distNorm = Math.sqrt(
      ((px - cx) / cx) ** 2 + ((py - cy) / cy) ** 2,
    )
    const spatialWeight = Math.max(0.3, 1 - distNorm * 0.25)
    const w = conf * spatialWeight

    weightedX += px * w
    weightedY += py * w
    totalWeight += w
  }

  state.prevFrame = imageData

  // Fallback to peak if centroid is too weak
  const strength = totalWeight / (CANVAS_W * CANVAS_H)
  if (strength < 0.012) {
    // Not enough signal – return null (face probably not visible)
    return null
  }

  let faceCx: number
  let faceCy: number

  if (totalWeight > 0) {
    faceCx = weightedX / totalWeight
    faceCy = weightedY / totalWeight
  } else {
    faceCx = maxIdx % CANVAS_W
    faceCy = (maxIdx / CANVAS_W) | 0
  }

  // Smooth with previous position (exponential moving average)
  const alpha = 0.35
  state.smoothX = state.smoothX + alpha * (faceCx / CANVAS_W - state.smoothX)
  state.smoothY = state.smoothY + alpha * (faceCy / CANVAS_H - state.smoothY)

  // Estimate bounding-box size (heuristic: face ≈ 15‑30 % of frame)
  const rawSize = maxConf > 0.5 ? 0.28 : 0.22

  return {
    x: state.smoothX,
    y: state.smoothY,
    width: rawSize,
    height: rawSize * (CANVAS_H / CANVAS_W),
  }
}

/* ── Native FaceDetector API wrapper ────────────────────────────────── */

async function nativeDetect(
  video: HTMLVideoElement,
  detector: FaceDetector,
): Promise<FaceBox | null> {
  try {
    const faces = await detector.detect(video)
    if (!faces.length) return null

    // Use the largest face (closest to camera)
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

    // Normalise to 0‑1
    const padding = 0.05 // slight inset so framing isn't too tight
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

/* ── Tracker class ──────────────────────────────────────────────────── */

export type FaceCallback = (face: FaceBox | null, engine: FaceEngine) => void

export class FaceTracker {
  private video: HTMLVideoElement
  private canvas: HTMLCanvasElement | null = null
  private ctx: CanvasRenderingContext2D | null = null
  private state = createState()
  private detector: FaceDetector | null = null
  private engine: FaceEngine = "none"
  private timerId: ReturnType<typeof setInterval> | null = null
  private callback: FaceCallback

  private useNative: boolean

  constructor(video: HTMLVideoElement, callback: FaceCallback) {
    this.video = video
    this.callback = callback
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
        // Native API available but construction failed – fall through
        this.useNative = false
      }
    }

    if (!this.useNative) {
      this.engine = "canvas"
      this.canvas = document.createElement("canvas")
      this.canvas.width = CANVAS_W
      this.canvas.height = CANVAS_H
      this.ctx = this.canvas.getContext("2d", { willReadFrequently: true })
    }

    this.timerId = setInterval(() => this.tick(), SCAN_INTERVAL_MS)
  }

  stop() {
    if (this.timerId !== null) {
      clearInterval(this.timerId)
      this.timerId = null
    }
    this.detector = null
    this.canvas = null
    this.ctx = null
  }

  private tick() {
    if (this.video.readyState < 2) return // video not ready yet

    let face: FaceBox | null = null

    if (this.useNative && this.detector) {
      nativeDetect(this.video, this.detector).then((result) => {
        this.callback(result ?? null, this.engine)
      })
      return // async – result handled in promise
    }

    // Canvas fallback (synchronous)
    if (this.canvas && this.ctx) {
      face = canvasDetect(this.video, this.ctx, this.state)
    }

    this.callback(face, this.engine)
  }
}
