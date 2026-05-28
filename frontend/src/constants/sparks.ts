import type { SparkStatus } from "@/types/alaqay"

export const sparkStatusLabel: Record<SparkStatus, string> = {
  done: "Lit",
  active: "Ready",
  missed: "Ash",
  upcoming: "Soon",
}
