import { HugeiconsIcon } from "@hugeicons/react"
import { CheckmarkCircle02Icon, PlayCircleIcon, Timer02Icon } from "@hugeicons/core-free-icons"
import { useState, type CSSProperties } from "react"

import { ProgressLine } from "@/components/sparks/ProgressLine"
import { SparkGlyph } from "@/components/sparks/SparkGlyph"
import { Button } from "@/components/ui/button"
import { useBrushSession } from "@/hooks/useBrushSession"

type BrushView = "ready" | "brushing" | "done"

type MirrorScreenProps = {
  onClose?: () => void
  showReminder?: boolean
}

export function MirrorScreen({ onClose, showReminder = true }: MirrorScreenProps) {
  const session = useBrushSession()
  const [isReminderOpen, setIsReminderOpen] = useState(showReminder)
  const view: BrushView = session.isComplete ? "done" : session.elapsed > 0 || session.isRunning ? "brushing" : "ready"

  const startGuidedBrush = () => {
    setIsReminderOpen(false)
    session.start()
  }

  const brushAgain = () => {
    setIsReminderOpen(false)
    session.start()
  }

  if (view === "done") {
    return <BrushDoneScreen onBrushAgain={brushAgain} onClose={onClose} />
  }

  if (view === "brushing") {
    return (
      <BrushSessionScreen
        activeZone={session.activeZone.label}
        elapsed={session.elapsed}
        error={session.error}
        isRunning={session.isRunning}
        isSaving={session.isSaving}
        remainingSeconds={session.remainingSeconds}
        totalSeconds={session.totalSeconds}
        zones={session.zones}
        onDone={session.markDone}
        onPause={session.pause}
        onResume={session.resume}
      />
    )
  }

  if (isReminderOpen) {
    return (
      <BrushReminderScreen
        error={session.error}
        isPreparing={session.isPreparing}
        isSaving={session.isSaving}
        slot={session.targetSpark?.slot ?? "evening"}
        onMarkDone={session.markDone}
        onStart={startGuidedBrush}
      />
    )
  }

  return (
    <BrushReadyScreen
      error={session.error}
      slot={session.targetSpark?.slot ?? "evening"}
      isPreparing={session.isPreparing}
      isSaving={session.isSaving}
      onMarkDone={session.markDone}
      onStart={session.start}
    />
  )
}

function BrushReadyScreen({
  error,
  isSaving,
  isPreparing,
  onMarkDone,
  onStart,
  slot,
}: {
  error: string | null
  isPreparing: boolean
  isSaving: boolean
  onMarkDone: () => void
  onStart: () => void
  slot: string
}) {
  return (
    <div className="screen-stack brush-screen">
      <section className="brush-ready-hero">
        <SparkGlyph status="active" size="lg" />
        <p className="eyebrow">{slot} Spark</p>
        <h1>Time to brush?</h1>
        <p>Two calm minutes. Alaqay guides the rhythm and lights your Spark when you finish.</p>
      </section>

      <section className="brush-choice-grid">
        <button className="brush-choice primary" type="button" onClick={onStart} disabled={isPreparing}>
          <HugeiconsIcon icon={PlayCircleIcon} size={24} />
          <strong>{isPreparing ? "Preparing Spark..." : "Brush together"}</strong>
          <span>Guided timer and zone flow</span>
        </button>
        <button className="brush-choice" type="button" onClick={onMarkDone} disabled={isSaving || isPreparing}>
          <HugeiconsIcon icon={CheckmarkCircle02Icon} size={24} />
          <strong>{isSaving ? "Saving..." : "I brushed already"}</strong>
          <span>Confirm and light this Spark</span>
        </button>
      </section>
      {error && <p className="brush-error">{error}</p>}
    </div>
  )
}

function BrushReminderScreen({
  error,
  isPreparing,
  isSaving,
  onMarkDone,
  onStart,
  slot,
}: {
  error: string | null
  isPreparing: boolean
  isSaving: boolean
  onMarkDone: () => void
  onStart: () => void
  slot: string
}) {
  return (
    <div className="screen-stack brush-screen">
      <section className="brush-reminder-hero">
        <div className="brush-reminder-spark">
          <SparkGlyph status="active" size="lg" />
        </div>
        <p className="eyebrow">{slot} Spark</p>
        <h1>Time to light it.</h1>
        <p>Start a calm two-minute brush now, or confirm if you already finished.</p>
      </section>

      <section className="brush-reminder-actions" aria-label="Brush actions">
        <button className="brush-reminder-action primary" type="button" onClick={onStart} disabled={isPreparing}>
          <span>
            <HugeiconsIcon icon={PlayCircleIcon} size={24} />
          </span>
          <strong>{isPreparing ? "Preparing..." : "Brush together"}</strong>
          <small>Timer, zones, rhythm</small>
        </button>

        <button className="brush-reminder-action" type="button" onClick={onMarkDone} disabled={isSaving || isPreparing}>
          <span>
            <HugeiconsIcon icon={CheckmarkCircle02Icon} size={24} />
          </span>
          <strong>{isSaving ? "Saving..." : "Already brushed"}</strong>
          <small>Light Spark instantly</small>
        </button>
      </section>

      {error && <p className="brush-error">{error}</p>}
    </div>
  )
}

function BrushSessionScreen({
  activeZone,
  elapsed,
  error,
  isRunning,
  isSaving,
  onDone,
  onPause,
  onResume,
  remainingSeconds,
  totalSeconds,
  zones,
}: {
  activeZone: string
  elapsed: number
  error: string | null
  isRunning: boolean
  isSaving: boolean
  onDone: () => void
  onPause: () => void
  onResume: () => void
  remainingSeconds: number
  totalSeconds: number
  zones: Array<{ id: string; label: string; progress: number }>
}) {
  return (
    <div className="screen-stack brush-screen">
      <section className="brush-session-hero">
        <div className="brush-ring" style={{ "--brush-progress": `${(elapsed / totalSeconds) * 360}deg` } as CSSProperties}>
          <div>
            <strong>{formatTime(remainingSeconds)}</strong>
            <span>{activeZone}</span>
          </div>
        </div>
        <p>Gentle circles. No pressure. Keep the rhythm steady.</p>
      </section>

      <section className="brush-zone-list">
        {zones.map((zone) => (
          <div className={zone.label === activeZone ? "active" : ""} key={zone.id}>
            <span>{zone.label}</span>
            <strong>{zone.progress}%</strong>
            <ProgressLine value={zone.progress} />
          </div>
        ))}
      </section>

      <div className="brush-actions">
        <Button variant="outline" onClick={isRunning ? onPause : onResume}>
          <HugeiconsIcon icon={Timer02Icon} size={18} />
          {isRunning ? "Pause" : "Resume"}
        </Button>
        <Button className="primary-glow" onClick={onDone} disabled={isSaving}>
          {isSaving ? "Saving..." : "Finish"}
        </Button>
      </div>
      {error && <p className="brush-error">{error}</p>}
    </div>
  )
}

function BrushDoneScreen({ onBrushAgain, onClose }: { onBrushAgain: () => void; onClose?: () => void }) {
  return (
    <div className="screen-stack brush-screen">
      <section className="brush-done-hero">
        <SparkGlyph status="done" size="lg" />
        <p className="eyebrow">Spark lit</p>
        <h1>Nice work.</h1>
        <p>Your routine is logged. The dashboard will show this Spark as done.</p>
      </section>
      <div className="brush-done-actions">
        <Button variant="outline" onClick={onBrushAgain}>Brush again</Button>
        {onClose && <Button className="primary-glow" onClick={onClose}>Dashboard</Button>}
      </div>
    </div>
  )
}

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60
  return `${minutes}:${rest.toString().padStart(2, "0")}`
}
