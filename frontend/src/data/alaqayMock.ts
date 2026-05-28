import type {
  BrushZone,
  FamilyMember,
  Lesson,
  OnboardingStep,
  Profile,
  SparkSlot,
  WeekSpark,
} from "@/types/alaqay"

export const profile: Profile = {
  name: "Amina",
  age: 9,
  streak: 12,
  totalSparks: 148,
  level: "Spark Keeper",
  morningTime: "07:30",
  eveningTime: "21:15",
}

export const sparkSlots: SparkSlot[] = [
  {
    id: "morning",
    title: "Morning Spark",
    time: "07:30",
    status: "done",
    progress: 100,
    note: "Clean start. Spark is shining.",
  },
  {
    id: "evening",
    title: "Evening Spark",
    time: "21:15",
    status: "active",
    progress: 42,
    note: "Ready when the evening routine starts.",
  },
]

export const weekSparks: WeekSpark[] = [
  { day: "Mon", morning: "done", evening: "done" },
  { day: "Tue", morning: "done", evening: "done" },
  { day: "Wed", morning: "done", evening: "missed" },
  { day: "Thu", morning: "done", evening: "done" },
  { day: "Fri", morning: "done", evening: "done" },
  { day: "Sat", morning: "done", evening: "active" },
  { day: "Sun", morning: "upcoming", evening: "upcoming" },
]

export const brushZones: BrushZone[] = [
  { id: "front", label: "Front teeth", progress: 86 },
  { id: "left", label: "Left side", progress: 64 },
  { id: "right", label: "Right side", progress: 52 },
  { id: "inside", label: "Inside zones", progress: 38 },
]

export const familyMembers: FamilyMember[] = [
  {
    id: "amina",
    name: "Amina",
    role: "You",
    avatar: "AM",
    sparks: 2,
    morning: "done",
    evening: "active",
    needsReminder: false,
  },
  {
    id: "timur",
    name: "Timur",
    role: "Brother",
    avatar: "TI",
    sparks: 1,
    morning: "done",
    evening: "upcoming",
    needsReminder: true,
  },
  {
    id: "mama",
    name: "Mama",
    role: "Parent",
    avatar: "MA",
    sparks: 2,
    morning: "done",
    evening: "done",
    needsReminder: false,
  },
]

export const lessons: Lesson[] = [
  { id: "circles", title: "Tiny circles, clean enamel", duration: "1:20", level: "Kids", progress: 72 },
  { id: "gumline", title: "Gumline without pressure", duration: "2:05", level: "Family", progress: 34 },
  { id: "timer", title: "Two-minute rhythm", duration: "0:55", level: "Adult", progress: 0 },
]

export const onboardingSteps: OnboardingStep[] = [
  {
    kicker: "Welcome",
    title: "Light your daily Sparks",
    body: "Alaqay turns morning and evening brushing into a warm little ritual.",
  },
  {
    kicker: "Personalize",
    title: "A routine that fits your age",
    body: "Kids get playful cues, adults get calmer progress and precise timing.",
  },
  {
    kicker: "Schedule",
    title: "Two moments, one habit",
    body: "Set the morning and evening Spark windows and keep the chain alive.",
  },
  {
    kicker: "Permissions",
    title: "Camera and reminders, explained",
    body: "Mirror mode uses the camera locally. Notifications help when a Spark is waiting.",
  },
]
