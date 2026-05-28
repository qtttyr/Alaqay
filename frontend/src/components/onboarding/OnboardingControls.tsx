import { HugeiconsIcon } from "@hugeicons/react"
import {
  CameraAiIcon,
  CheckmarkCircle02Icon,
  Clock01Icon,
  KidIcon,
  Notification02Icon,
  UserCircleIcon,
} from "@hugeicons/core-free-icons"

import { ProgressLine } from "@/components/sparks/ProgressLine"
import { Input } from "@/components/ui/input"
import { brushZones } from "@/data/alaqayMock"

const ageOptions = [
  { value: 6, label: "Child", helper: "Playful cues" },
  { value: 9, label: "Kid", helper: "Game rhythm" },
  { value: 14, label: "Teen", helper: "Clear goals" },
  { value: 24, label: "Adult", helper: "Calm tracking" },
]

const timePresets = {
  morning: ["07:00", "07:30", "08:00"],
  evening: ["20:30", "21:00", "21:30"],
}

type AgePickerProps = {
  value: number
  onChange: (age: number) => void
}

type RoutinePickerProps = {
  eveningTime: string
  morningTime: string
  onEveningChange: (time: string) => void
  onMorningChange: (time: string) => void
}

export function AgePicker({ value, onChange }: AgePickerProps) {
  return (
    <div className="age-picker">
      {ageOptions.map((option) => (
        <button
          className={option.value === value ? "selected" : ""}
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
        >
          <HugeiconsIcon icon={option.value <= 9 ? KidIcon : UserCircleIcon} size={20} />
          <strong>{option.value}</strong>
          <span>{option.label}</span>
          <small>{option.helper}</small>
        </button>
      ))}
    </div>
  )
}

export function RoutinePicker({
  eveningTime,
  morningTime,
  onEveningChange,
  onMorningChange,
}: RoutinePickerProps) {
  return (
    <div className="routine-picker">
      <TimeSlot
        helper="When the first Spark should wake up."
        label="Morning Spark"
        presets={timePresets.morning}
        value={morningTime}
        onChange={onMorningChange}
      />
      <TimeSlot
        helper="A soft reminder before sleep."
        label="Evening Spark"
        presets={timePresets.evening}
        value={eveningTime}
        onChange={onEveningChange}
      />
    </div>
  )
}

export function DemoStrip() {
  return (
    <div className="demo-strip">
      {brushZones.map((zone) => (
        <div key={zone.id}>
          <span>{zone.label}</span>
          <ProgressLine value={zone.progress} />
        </div>
      ))}
    </div>
  )
}

export function PermissionPreview() {
  return (
    <div className="permission-grid">
      <div>
        <HugeiconsIcon icon={Notification02Icon} size={21} />
        <strong>Smart reminders</strong>
        <span>Only around your Spark times.</span>
      </div>
      <div>
        <HugeiconsIcon icon={CameraAiIcon} size={21} />
        <strong>Mirror mode</strong>
        <span>Camera access is asked before use.</span>
      </div>
    </div>
  )
}

function TimeSlot({
  helper,
  label,
  onChange,
  presets,
  value,
}: {
  helper: string
  label: string
  onChange: (time: string) => void
  presets: string[]
  value: string
}) {
  return (
    <article className="time-slot">
      <div className="time-slot-header">
        <span className="time-icon"><HugeiconsIcon icon={Clock01Icon} size={18} /></span>
        <div>
          <strong>{label}</strong>
          <small>{helper}</small>
        </div>
        <HugeiconsIcon icon={CheckmarkCircle02Icon} size={18} />
      </div>
      <Input className="time-input" type="time" value={value} onChange={(event) => onChange(event.target.value)} />
      <div className="time-presets">
        {presets.map((preset) => (
          <button className={preset === value ? "active" : ""} key={preset} type="button" onClick={() => onChange(preset)}>
            {preset}
          </button>
        ))}
      </div>
    </article>
  )
}
