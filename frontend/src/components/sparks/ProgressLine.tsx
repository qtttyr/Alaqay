type ProgressLineProps = {
  value: number
}

export function ProgressLine({ value }: ProgressLineProps) {
  return (
    <div className="progress-line">
      <span style={{ width: `${value}%` }} />
    </div>
  )
}
