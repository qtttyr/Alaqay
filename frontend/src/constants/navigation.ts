import {
  BookOpen01Icon,
  Home03Icon,
  MirrorIcon,
  UserCircleIcon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons"

import type { NavItem } from "@/types/navigation"

export const navItems: NavItem[] = [
  { id: "home", label: "Home", icon: Home03Icon },
  { id: "mirror", label: "Mirror", icon: MirrorIcon },
  { id: "battle", label: "Battle", icon: UserGroupIcon },
  { id: "learn", label: "Learn", icon: BookOpen01Icon },
  { id: "profile", label: "Profile", icon: UserCircleIcon },
]
