import { BottomNav } from "@/components/layout/BottomNav"
import { BattleScreen } from "@/screens/BattleScreen"
import { DashboardScreen } from "@/screens/DashboardScreen"
import { LearnScreen } from "@/screens/LearnScreen"
import { MirrorScreen } from "@/screens/MirrorScreen"
import { ProfileScreen } from "@/screens/ProfileScreen"
import type { AppTab } from "@/types/navigation"

type AppShellProps = {
  activeTab: AppTab
  onStartBrush: () => void
  onTabChange: (tab: AppTab) => void
}

export function AppShell({ activeTab, onStartBrush, onTabChange }: AppShellProps) {
  return (
    <main className="app-shell">
      <div className="app-frame">
        {activeTab === "home" && <DashboardScreen onStartBrush={onStartBrush} />}
        {activeTab === "mirror" && <MirrorScreen />}
        {activeTab === "battle" && <BattleScreen />}
        {activeTab === "learn" && <LearnScreen />}
        {activeTab === "profile" && <ProfileScreen />}
        <BottomNav activeTab={activeTab} onChange={onTabChange} />
      </div>
    </main>
  )
}
