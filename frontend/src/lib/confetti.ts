import confetti from "canvas-confetti"

const LIME_COLORS = ["#a3e635", "#84cc16", "#65a30d", "#bef264"]
const WARM_COLORS = ["#facc15", "#fef08a", "#a3e635", "#d9f99d"]

/**
 * Celebrate a completed brush session with a gentle confetti burst.
 * Fires an initial burst then a soft stream for 1.5 seconds.
 */
export function fireBrushCompleteConfetti() {
  const origin = { x: 0.5, y: 0.55 }

  // Initial burst
  confetti({
    particleCount: 60,
    spread: 90,
    origin,
    colors: LIME_COLORS,
    startVelocity: 35,
    gravity: 0.7,
    ticks: 80,
    scalar: 0.9,
  })

  // Small side bursts
  confetti({
    particleCount: 20,
    angle: 240,
    spread: 40,
    origin: { x: 0.3, y: 0.6 },
    colors: WARM_COLORS,
    startVelocity: 20,
    gravity: 0.5,
    scalar: 0.7,
  })

  confetti({
    particleCount: 20,
    angle: 300,
    spread: 40,
    origin: { x: 0.7, y: 0.6 },
    colors: WARM_COLORS,
    startVelocity: 20,
    gravity: 0.5,
    scalar: 0.7,
  })

  // Gentle trailing stream
  const end = Date.now() + 1500
  const frame = () => {
    confetti({
      particleCount: 2,
      startVelocity: 18,
      spread: 45,
      origin,
      colors: LIME_COLORS,
      ticks: 50,
      gravity: 0.4,
      scalar: 0.6,
    })

    if (Date.now() < end) {
      requestAnimationFrame(frame)
    }
  }

  requestAnimationFrame(frame)
}
