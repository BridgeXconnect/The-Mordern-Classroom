import {
  GraduationCap,
  LayoutDashboard,
  Library,
  Brain,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

/** Shared teacher navigation — consumed by the desktop sidebar and mobile drawer. */
export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/classes", label: "Classes", icon: GraduationCap },
  { href: "/quizzes", label: "Quizzes", icon: Brain },
  { href: "/media", label: "Media", icon: Library },
];
