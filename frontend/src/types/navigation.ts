import type { ComponentProps } from "react"
import { HugeiconsIcon } from "@hugeicons/react"

export type AppStage = "auth" | "onboarding" | "app"

export type AppTab = "home" | "mirror" | "battle" | "learn" | "profile"

export type NavItem = {
  id: AppTab
  label: string
  icon: ComponentProps<typeof HugeiconsIcon>["icon"]
}
