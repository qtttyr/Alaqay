import { HugeiconsIcon } from "@hugeicons/react"
import { Fire02Icon, SparklesIcon } from "@hugeicons/core-free-icons"

import type { SparkStatus } from "@/types/alaqay"

type SparkGlyphProps = {
  status: SparkStatus
  size?: "sm" | "md" | "lg"
}

const iconSize = {
  sm: 16,
  md: 24,
  lg: 34,
}

export function SparkGlyph({ status, size = "md" }: SparkGlyphProps) {
  const icon = status === "missed" ? SparklesIcon : Fire02Icon

  return (
    <span className={`spark-glyph spark-${status} spark-${size}`}>
      <HugeiconsIcon icon={icon} size={iconSize[size]} />
    </span>
  )
}
