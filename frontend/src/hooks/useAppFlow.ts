import { useState } from "react"

import type { AppStage, AppTab } from "@/types/navigation"

export function useAppFlow() {
  const [stage, setStage] = useState<AppStage>("auth")
  const [activeTab, setActiveTab] = useState<AppTab>("home")

  return {
    activeTab,
    completeAuth: () => setStage("onboarding"),
    completeOnboarding: () => setStage("app"),
    goToBrush: () => setActiveTab("mirror"),
    setActiveTab,
    stage,
  }
}
