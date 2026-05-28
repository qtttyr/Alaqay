import { HugeiconsIcon } from "@hugeicons/react"
import { ShieldUserIcon } from "@hugeicons/core-free-icons"

import { ScreenHeader } from "@/components/layout/ScreenHeader"
import { SparkGlyph } from "@/components/sparks/SparkGlyph"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useBattleMembers } from "@/hooks/useBattleMembers"

export function BattleScreen() {
  const familyMembers = useBattleMembers()

  return (
    <div className="screen-stack">
      <ScreenHeader
        eyebrow="Family Battle"
        title="Evening board"
        action={
          <Button variant="outline" size="icon">
            <HugeiconsIcon icon={ShieldUserIcon} size={18} />
          </Button>
        }
      />

      <section className="leader-card">
        <div>
          <span>Family score</span>
          <strong>5/6</strong>
        </div>
        <p>One Spark left before everyone closes the day.</p>
      </section>

      <section className="family-list">
        {familyMembers.map((member) => (
          <Card className="member-card" key={member.id}>
            <CardContent>
              <Avatar size="lg" className="avatar-green">
                <AvatarFallback>{member.avatar}</AvatarFallback>
              </Avatar>
              <div className="member-main">
                <strong>{member.name}</strong>
                <span>{member.role}</span>
              </div>
              <div className="member-sparks">
                <SparkGlyph status={member.morning} size="sm" />
                <SparkGlyph status={member.evening} size="sm" />
              </div>
              {member.needsReminder && <Button variant="secondary" size="sm">Remind</Button>}
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  )
}
