import { HugeiconsIcon } from "@hugeicons/react"
import { ActivitySparkIcon } from "@hugeicons/core-free-icons"

export function LogoOrbit() {
  return (
    <div className="logo-orbit" aria-hidden="true">
      <div className="logo-mark">
        <HugeiconsIcon icon={ActivitySparkIcon} size={42} strokeWidth={1.8} />
      </div>
      <span />
      <span />
      <span />
    </div>
  )
}
