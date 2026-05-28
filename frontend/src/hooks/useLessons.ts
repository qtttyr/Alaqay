import { useEffect, useState } from "react"

import { lessonsApi } from "@/api/lessonsApi"
import { useAuth } from "@/hooks/useAuth"
import type { Lesson } from "@/types/alaqay"

export function useLessons() {
  const { profile } = useAuth()
  const [lessons, setLessons] = useState<Lesson[]>([])

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      const data = await lessonsApi.getLessons(profile?.age_group)
      if (!cancelled) setLessons(data)
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [profile?.age_group])

  return lessons
}
