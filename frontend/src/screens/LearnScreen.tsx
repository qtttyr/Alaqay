import { HugeiconsIcon } from "@hugeicons/react"
import { BookOpen01Icon, PlayCircleIcon } from "@hugeicons/core-free-icons"

import { ScreenHeader } from "@/components/layout/ScreenHeader"
import { ProgressLine } from "@/components/sparks/ProgressLine"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useLessons } from "@/hooks/useLessons"

export function LearnScreen() {
  const lessons = useLessons()

  return (
    <div className="screen-stack">
      <ScreenHeader
        eyebrow="Learn"
        title="Tiny lessons"
        action={
          <Button variant="outline" size="icon">
            <HugeiconsIcon icon={BookOpen01Icon} size={18} />
          </Button>
        }
      />

      <section className="lesson-feature">
        <div className="lesson-feature-copy">
          <span>Recommended</span>
          <h2>Brush every zone, not harder.</h2>
          <p>Short visual guide for a calmer two-minute routine.</p>
        </div>
        <div className="lesson-feature-play">
          <HugeiconsIcon icon={PlayCircleIcon} size={30} />
        </div>
      </section>

      <section className="lesson-list">
        {lessons.map((lesson) => (
          <Card className="lesson-card" key={lesson.id}>
            <CardContent>
              <div className="play-dot">
                <HugeiconsIcon icon={PlayCircleIcon} size={18} />
              </div>
              <div className="lesson-main">
                <strong>{lesson.title}</strong>
                <span>{lesson.level} / {lesson.duration}</span>
                <ProgressLine value={lesson.progress} />
              </div>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  )
}
