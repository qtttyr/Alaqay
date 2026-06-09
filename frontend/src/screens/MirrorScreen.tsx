import { HugeiconsIcon } from "@hugeicons/react"
import { CheckmarkCircle02Icon, PlayCircleIcon } from "@hugeicons/core-free-icons"
import { useEffect, useState } from "react"

import { BrushMirrorSession } from "@/components/brush/BrushMirrorSession"
import { SparkGlyph } from "@/components/sparks/SparkGlyph"
import { Button } from "@/components/ui/button"
import { fireBrushCompleteConfetti } from "@/lib/confetti"
import { useBrushSession } from "@/hooks/useBrushSession"

type BrushView = "ready" | "brushing" | "done"

type MirrorScreenProps = {
  onClose?: () => void
  showReminder?: boolean
}

export function MirrorScreen({ onClose, showReminder = true }: MirrorScreenProps) {
  const session = useBrushSession()
  const [isReminderOpen, setIsReminderOpen] = useState(showReminder)
  const [hasStarted, setHasStarted] = useState(false)
  const view: BrushView = session.isComplete ? "done" : hasStarted || session.elapsed > 0 || session.isRunning ? "brushing" : "ready"

  const startGuidedBrush = () => {
    setIsReminderOpen(false)
    setHasStarted(true)
    session.start()
  }

  const brushAgain = () => {
    setIsReminderOpen(false)
    setHasStarted(true)
    session.start()
  }

  if (view === "done") {
    return <BrushDoneScreen onBrushAgain={brushAgain} onClose={onClose} />
  }

  if (view === "brushing") {
    return (
      <BrushSessionScreen
        activeZone={session.activeZone}
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
      onStart={() => {
        setHasStarted(true)
        session.start()
      }}
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
  activeZone: { id: string; label: string; progress: number }
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
      <BrushMirrorSession
        activeZone={activeZone}
        error={error}
        isRunning={isRunning}
        isSaving={isSaving}
        remainingSeconds={remainingSeconds}
        totalSeconds={totalSeconds}
        zones={zones}
        onDone={onDone}
        onPause={onPause}
        onResume={onResume}
      />
    </div>
  )
}

function BrushDoneScreen({ onBrushAgain, onClose }: { onBrushAgain: () => void; onClose?: () => void }) {
  useEffect(() => {
    fireBrushCompleteConfetti()
  }, [])

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
