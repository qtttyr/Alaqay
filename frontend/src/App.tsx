import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom"
import { AuthProvider, useAuth } from "@/hooks/useAuth"
import { AppShell } from "@/components/layout/AppShell"
import { AuthScreen } from "@/screens/AuthScreen"
import { MirrorScreen } from "@/screens/MirrorScreen"
import { OnboardingScreen } from "@/screens/OnboardingScreen"
import { useSparkReminderScheduler } from "@/hooks/useSparkReminderScheduler"

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <SparkReminderRuntime />
        <Routes>
          <Route path="/auth" element={<AuthScreenWrapper />} />
          <Route path="/brush" element={<BrushRoute />} />
          <Route path="/onboarding" element={<OnboardingScreenWrapper />} />
          <Route path="/app/*" element={<AppRoutes />} />
          <Route path="*" element={<Navigate to="/auth" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

function SparkReminderRuntime() {
  useSparkReminderScheduler()
  return null
}

function BrushRoute() {
  const { isAuthenticated, isLoading, isOnboardingComplete } = useAuth()
  const navigate = useNavigate()

  if (isLoading) return <AuthLoadingScreen />

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />
  }

  if (!isOnboardingComplete) {
    return <Navigate to="/onboarding" replace />
  }

  return (
    <main className="app-shell">
      <div className="app-frame brush-route-frame">
        <MirrorScreen onClose={() => navigate("/app/home")} />
      </div>
    </main>
  )
}

function AuthScreenWrapper() {
  const { isAuthenticated, isLoading, isOnboardingComplete } = useAuth()

  if (isLoading) return <AuthLoadingScreen />

  if (isAuthenticated) {
    if (!isOnboardingComplete) {
      return <Navigate to="/onboarding" replace />
    }
    return <Navigate to="/app/home" replace />
  }

  return <AuthScreen />
}

function OnboardingScreenWrapper() {
  const { isAuthenticated, isLoading, isOnboardingComplete } = useAuth()

  if (isLoading) return <AuthLoadingScreen />

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />
  }

  if (isOnboardingComplete) {
    return <Navigate to="/app/home" replace />
  }

  return <OnboardingScreen />
}

function AppRoutes() {
  const { activeTab, goToBrush, isAuthenticated, isLoading, setActiveTab } = useAuth()

  if (isLoading) return <AuthLoadingScreen />

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />
  }

  return (
    <AppShell activeTab={activeTab} onStartBrush={goToBrush} onTabChange={setActiveTab} />
  )
}

function AuthLoadingScreen() {
  return (
    <main className="auth-loading-screen">
      <div>Loading Alaqay...</div>
    </main>
  )
}
