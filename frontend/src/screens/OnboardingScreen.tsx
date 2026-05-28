import { useState } from "react"
import { useNavigate } from "react-router-dom"

import {
  AgePicker,
  DemoStrip,
  PermissionPreview,
  RoutinePicker,
} from "@/components/onboarding/OnboardingControls"
import { SparkGlyph } from "@/components/sparks/SparkGlyph"
import { Button } from "@/components/ui/button"
import { onboardingSteps } from "@/data/alaqayMock"
import { useAuth } from "@/hooks/useAuth"

export function OnboardingScreen() {
  const navigate = useNavigate()
  const { completeOnboarding, isLoading } = useAuth()
  const [step, setStep] = useState(0)
  const [ageGroup, setAgeGroup] = useState(9)
  const [morningTime, setMorningTime] = useState("07:00")
  const [eveningTime, setEveningTime] = useState("21:00")

  const current = onboardingSteps[step]
  const isLast = step === onboardingSteps.length - 1

  const handleFinish = async () => {
    try {
      await completeOnboarding({
        age_group: ageGroup,
        morning_time: morningTime,
        evening_time: eveningTime,
      })
      navigate("/app/home")
    } catch (error) {
      console.error("Failed to complete onboarding:", error)
    }
  }

  return (
    <main className="onboarding-screen">
      <div className="phone-topbar">
        <span>Alaqay</span>
        <div className="step-progress" aria-label={`Step ${step + 1} of ${onboardingSteps.length}`}>
          <span style={{ width: `${((step + 1) / onboardingSteps.length) * 100}%` }} />
        </div>
      </div>

      <section className="onboarding-stage">
        <div className="spark-showcase">
          <SparkGlyph status={step === 3 ? "active" : "done"} size="lg" />
          <div className="spark-ring ring-one" />
          <div className="spark-ring ring-two" />
        </div>
        <div className="onboarding-copy">
          <p className="eyebrow">{current.kicker}</p>
          <h1>{current.title}</h1>
          <p>{current.body}</p>
        </div>
      </section>

      <section className="setup-panel">
        {step === 0 && (
          <AgePicker 
            value={ageGroup} 
            onChange={setAgeGroup} 
          />
        )}
        {step === 1 && (
          <RoutinePicker 
            morningTime={morningTime}
            eveningTime={eveningTime}
            onMorningChange={setMorningTime}
            onEveningChange={setEveningTime}
          />
        )}
        {step === 2 && <DemoStrip />}
        {step === 3 && <PermissionPreview />}
      </section>

      <div className="onboarding-actions">
        <div className="dots">
          {onboardingSteps.map((item, index) => (
            <span className={index === step ? "active" : ""} key={item.title} />
          ))}
        </div>
        <Button 
          onClick={() => (isLast ? handleFinish() : setStep((value) => value + 1))}
          disabled={isLoading}
        >
          {isLoading ? "Saving..." : isLast ? "Open dashboard" : "Continue"}
        </Button>
      </div>
    </main>
  )
}
