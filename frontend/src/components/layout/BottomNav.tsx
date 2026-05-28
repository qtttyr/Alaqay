import { HugeiconsIcon } from "@hugeicons/react"

import { navItems } from "@/constants/navigation"
import type { AppTab } from "@/types/navigation"

type BottomNavProps = {
  activeTab: AppTab
  onChange: (tab: AppTab) => void
}

export function BottomNav({ activeTab, onChange }: BottomNavProps) {
  return (
    <nav className="bottom-nav" aria-label="Primary navigation">
      {navItems.map((item) => (
        <button
          className={activeTab === item.id ? "active" : ""}
          key={item.id}
          type="button"
          onClick={() => onChange(item.id)}
        >
          <HugeiconsIcon icon={item.icon} size={21} strokeWidth={1.7} />
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  )
}
