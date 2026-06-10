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
  const [sparkles, setSparkles] = useState<Array<{ id: number; x: number; y: number }>>([])
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

    // Map normalised face coordinates to container pixel space
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
      transform: `translate(0, 0)`,
      pointerEvents: "none",
      zIndex: 5,
      transition: "opacity 0.15s ease",
    })
  }, [face, isDetected, trackingAlpha, containerRef])

  // ── Sparkle burst on first detection ────────────────────────────
  useEffect(() => {
    if (isDetected && !prevDetected.current) {
      const newSparkles: Array<{ id: number; x: number; y: number }> = []
      for (let i = 0; i < 6; i++) {
        sparkleId.current += 1
        const angle = (Math.PI * 2 * i) / 6 + Math.random() * 0.4
        const dist = 40 + Math.random() * 50
        newSparkles.push({
          id: sparkleId.current,
          x: Math.cos(angle) * dist,
          y: Math.sin(angle) * dist - 20,
        })
      }
      setSparkles(newSparkles)

      // Clean sparkles after animation
      const timer = setTimeout(() => setSparkles([]), 800)
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
          border: `2.5px solid oklch(0.82 0.22 128 / ${0.25 + ringOpacity * 0.5})`,
          boxShadow: `inset 0 0 40px oklch(0.82 0.22 128 / ${0.04 + ringOpacity * 0.1}), 0 0 30px oklch(0.82 0.22 128 / ${0.06 * ringOpacity})`,
          background: `radial-gradient(circle, oklch(0.82 0.22 128 / ${0.03 * ringOpacity}), transparent 70%)`,
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

      {/* Sparkles */}
      {sparkles.map((s) => (
        <SparkleDot key={s.id} x={s.x} y={s.y} style={style} />
      ))}
    </>
  )
}

function SparkleDot({
  x,
  y,
  style,
}: {
  x: number
  y: number
  style: CSSProperties
}) {
  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        left: style.left as string | number,
        top: style.top as string | number,
        width: 6,
        height: 6,
        borderRadius: "50%",
        background: "oklch(0.82 0.22 128)",
        boxShadow: "0 0 8px oklch(0.82 0.22 128 / 0.6)",
        pointerEvents: "none",
        zIndex: 6,
        // Fly outward from the ring centre
        transform: `translate(${x}px, ${y}px) scale(0)`,
        animation: "sparkle-fly 0.7s ease-out forwards",
        opacity: 0,
      }}
    />
  )
}
