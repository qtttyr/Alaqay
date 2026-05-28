import { familyMembers as mockFamilyMembers } from "@/data/alaqayMock"
import { supabase } from "@/lib/supabase"
import type { FamilyMember } from "@/types/alaqay"

type ConnectionRecord = {
  connected_user_id: string
  role: string
  status: string
}

export const battleApi = {
  async getFamilyMembers(userId: string): Promise<FamilyMember[]> {
    const { data, error } = await supabase
      .from("family_connections")
      .select("connected_user_id, role, status")
      .eq("user_id", userId)
      .eq("status", "accepted")

    if (error || !data?.length) return mockFamilyMembers

    return data.map((connection: ConnectionRecord, index) => ({
      id: connection.connected_user_id,
      name: `Member ${index + 1}`,
      role: connection.role,
      avatar: `M${index + 1}`,
      sparks: 0,
      morning: "upcoming",
      evening: "upcoming",
      needsReminder: false,
    }))
  },
}
