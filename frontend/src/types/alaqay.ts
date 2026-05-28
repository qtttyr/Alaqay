export type SparkStatus = "done" | "active" | "missed" | "upcoming"

export type SparkSlot = {
  id: "morning" | "evening"
  title: string
  time: string
  status: SparkStatus
  progress: number
  note: string
}

export type WeekSpark = {
  day: string
  morning: SparkStatus
  evening: SparkStatus
}

export type BrushZone = {
  id: string
  label: string
  progress: number
}

export type FamilyMember = {
  id: string
  name: string
  role: string
  avatar: string
  sparks: number
  morning: SparkStatus
  evening: SparkStatus
  needsReminder: boolean
}

export type Lesson = {
  id: string
  title: string
  duration: string
  level: "Kids" | "Family" | "Adult"
  progress: number
}

export type OnboardingStep = {
  kicker: string
  title: string
  body: string
}

export type Profile = {
  name: string
  age: number
  streak: number
  totalSparks: number
  level: string
  morningTime: string
  eveningTime: string
}
