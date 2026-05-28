import { lessons as mockLessons } from "@/data/alaqayMock"
import { supabase } from "@/lib/supabase"
import type { Lesson } from "@/types/alaqay"

type LessonRecord = {
  id: string
  slug: string
  title: string
  description: string | null
  age_group: number | null
  order_index: number
}

export const lessonsApi = {
  async getLessons(ageGroup?: number | null): Promise<Lesson[]> {
    let query = supabase
      .from("lessons")
      .select("id, slug, title, description, age_group, order_index")
      .order("order_index")

    if (ageGroup) {
      query = query.or(`age_group.is.null,age_group.eq.${ageGroup}`)
    }

    const { data, error } = await query
    if (error || !data?.length) return mockLessons

    return data.map(toLesson)
  },
}

function toLesson(record: LessonRecord): Lesson {
  return {
    id: record.slug || record.id,
    title: record.title,
    duration: "1:30",
    level: record.age_group && record.age_group >= 14 ? "Adult" : "Kids",
    progress: 0,
  }
}
