import { useEffect, useState } from "react"

import { battleApi } from "@/api/battleApi"
import { useAuth } from "@/hooks/useAuth"
import type { FamilyMember } from "@/types/alaqay"

export function useBattleMembers() {
  const { user } = useAuth()
  const [members, setMembers] = useState<FamilyMember[]>([])

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      if (!user) return
      const data = await battleApi.getFamilyMembers(user.id)
      if (!cancelled) setMembers(data)
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [user])

  return members
}
