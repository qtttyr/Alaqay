import type { ReactNode } from "react"

type ScreenHeaderProps = {
  eyebrow: string
  title: string
  action?: ReactNode
}

export function ScreenHeader({ action, eyebrow, title }: ScreenHeaderProps) {
  return (
    <header className="screen-header">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
      </div>
      {action}
    </header>
  )
}
