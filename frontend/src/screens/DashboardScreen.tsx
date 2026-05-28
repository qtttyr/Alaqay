import { HugeiconsIcon } from "@hugeicons/react"
import { BrushIcon } from "@hugeicons/core-free-icons"

import { ScreenHeader } from "@/components/layout/ScreenHeader"
import { ProgressLine } from "@/components/sparks/ProgressLine"
import { SparkGlyph } from "@/components/sparks/SparkGlyph"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { sparkStatusLabel } from "@/constants/sparks"
import { useDashboardData } from "@/hooks/useDashboardData"

type DashboardScreenProps = {
  onStartBrush: () => void
}

export function DashboardScreen({ onStartBrush }: DashboardScreenProps) {
  const dashboard = useDashboardData()

  return (
    <div className="screen-stack">
      <ScreenHeader
        eyebrow="Today"
        title={`Hi, ${dashboard.displayName}`}
        action={<ProfileAvatar name={dashboard.displayName} />}
      />

      <section className="hero-panel">
        <div className="hero-copy">
          <p>{dashboard.isLoading ? "Syncing" : "Today"}</p>
          <div className="hero-metric">
            <strong>{dashboard.streak}</strong>
            <span>day Spark streak</span>
          </div>
          <small>Evening Spark is waiting at {dashboard.eveningTime}</small>
        </div>
        <div className="hero-spark">
          <SparkGlyph status={dashboard.streak > 0 ? "done" : "active"} size="lg" />
        </div>
      </section>

      <section className="spark-grid">
        {dashboard.sparkSlots.map((slot) => (
          <Card key={slot.id} className={`spark-card status-${slot.status}`}>
            <CardHeader>
              <div className="spark-card-title">
                <SparkGlyph status={slot.status} />
                <div>
                  <CardTitle>{slot.title}</CardTitle>
                  <CardDescription>{slot.time} / {sparkStatusLabel[slot.status]}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ProgressLine value={slot.progress} />
            </CardContent>
          </Card>
        ))}
      </section>

      <Button className="brush-cta primary-glow" size="lg" onClick={onStartBrush}>
        <HugeiconsIcon icon={BrushIcon} size={19} />
        Start brushing
      </Button>

      <section className="week-panel">
        <div className="section-title">
          <h2>Week rhythm</h2>
          <span>{dashboard.totalSparks} Sparks synced</span>
        </div>
        <div className="week-row">
          {dashboard.weekSparks.map((day) => (
            <div className="week-day" key={day.day}>
              <span>{day.day}</span>
              <SparkGlyph status={day.morning} size="sm" />
              <SparkGlyph status={day.evening} size="sm" />
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

function ProfileAvatar({ name }: { name: string }) {
  return (
    <Avatar size="lg" className="avatar-green">
      <AvatarFallback>{getInitials(name)}</AvatarFallback>
    </Avatar>
  )
}

function getInitials(name: string) {
  return name
    .split(/[.\s_-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "AL"
}
