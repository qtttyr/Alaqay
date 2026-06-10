import { type CSSProperties, useEffect, useRef, useState } from "react"

import type { FaceBox } from "@/lib/face-tracker"

interface FaceRingProps {
  face: FaceBox | null
  isDetected: boolean
  trackingAlpha: number
  containerRef: React.RefObject<HTMLDivElement | null>
}

/**
 * A glowing lime ring that follows detected faces.
 *
 * Shows a subtle tracking ring when a face is found, with a small "✨ Tracking"
 * badge that fades in after the first detection.  The ring pulses gently
 * while tracking to feel alive.
 */
export function FaceRing({ face, isDetected, trackingAlpha, containerRef }: FaceRingProps) {
  const [style, setStyle] = useState<CSSProperties>({ opacity: 0 })
  const [sparkles, setSparkles] = useState<Array<{ id: number; sx: string; sy: string }>>([])
  const sparkleId = useRef(0)
  const prevDetected = useRef(false)

  // ── Position the ring ──────────────────────────────────────────
  useEffect(() => {
    const container = containerRef.current
    if (!container || !face || !isDetected) {
      setStyle((s) => (s.opacity === 0 ? s : { ...s, opacity: 0 }))
      return
    }

    const rect = container.getBoundingClientRect()
    const cw = rect.width
    const ch = rect.height

    const cx = face.x * cw
    const cy = face.y * ch
    const size = Math.max(face.width * cw, face.height * ch) * 1.6

    setStyle({
      position: "absolute",
      left: cx - size / 2,
      top: cy - size / 2,
      width: size,
      height: size,
      opacity: trackingAlpha,
      pointerEvents: "none",
      zIndex: 5,
      transition: "opacity 0.15s ease",
    })
  }, [face, isDetected, trackingAlpha, containerRef])

  // ── Sparkle burst on first detection ────────────────────────────
  useEffect(() => {
    if (isDetected && !prevDetected.current) {
      const newSparkles: Array<{ id: number; sx: string; sy: string }> = []
      for (let i = 0; i < 6; i++) {
        sparkleId.current += 1
        const angle = (Math.PI * 2 * i) / 6 + Math.random() * 0.5
        const dist = 30 + Math.random() * 60
        newSparkles.push({
          id: sparkleId.current,
          sx: `${Math.cos(angle) * dist}px`,
          sy: `${Math.sin(angle) * dist - 20}px`,
        })
      }
      setSparkles(newSparkles)
      const timer = setTimeout(() => setSparkles([]), 900)
      prevDetected.current = true
      return () => clearTimeout(timer)
    }
    if (!isDetected) {
      prevDetected.current = false
    }
  }, [isDetected])

  const ringOpacity = Math.max(0, Math.min(1, trackingAlpha))

  return (
    <>
      {/* Ring */}
      <div
        aria-hidden
        style={{
          ...style,
          borderRadius: "50%",
          border: `2.5px solid oklch(0.82 0.22 128 / ${0.2 + ringOpacity * 0.55})`,
          boxShadow: `
            inset 0 0 40px oklch(0.82 0.22 128 / ${0.03 + ringOpacity * 0.08}),
            0 0 30px oklch(0.82 0.22 128 / ${0.05 * ringOpacity})
          `,
          background: `radial-gradient(circle, oklch(0.82 0.22 128 / ${0.02 * ringOpacity}), transparent 65%)`,
        }}
      />

      {/* Tracking badge */}
      <div
        aria-live="polite"
        className="face-tracking-badge"
        style={{
          opacity: ringOpacity,
          transform: `translateY(${ringOpacity > 0 ? 0 : 4}px)`,
          transition: "opacity 0.3s ease, transform 0.3s ease",
        }}
      >
        ✨ Tracking
      </div>

      {/* Sparkles — each one animated via inline style + transition */}
      {sparkles.map((s) => (
        <SparkDot key={s.id} sx={s.sx} sy={s.sy} baseStyle={style} />
      ))}
    </>
  )
}

function SparkDot({ sx, sy, baseStyle }: { sx: string; sy: string; baseStyle: CSSProperties }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Trigger enter animation on next frame
    const id = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(id)
  }, [])

  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        left: baseStyle.left,
        top: baseStyle.top,
        width: 5,
        height: 5,
        borderRadius: "50%",
        background: "oklch(0.82 0.22 128)",
        boxShadow: "0 0 10px oklch(0.82 0.22 128 / 0.7)",
        pointerEvents: "none",
        zIndex: 6,
        transform: mounted ? `translate(${sx}, ${sy}) scale(0)` : "translate(0, 0) scale(1.5)",
        opacity: mounted ? 0 : 1,
        transition: "transform 0.7s ease-out, opacity 0.7s ease-out",
      }}
    />
  )
}
