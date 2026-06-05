/* nav-items.ts — kept for MobileNav legacy compat; active nav uses Sidebar.tsx mode system */
import {
  LayoutGrid, CalendarDays, Inbox, GraduationCap,
  Sparkles, Library, ClipboardCheck, Headphones,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  section: "plan" | "create" | "library";
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/plan",             label: "Dashboard",       icon: LayoutGrid,     section: "plan" },
  { href: "/plan/calendar",    label: "Calendar",        icon: CalendarDays,   section: "plan" },
  { href: "/plan/attention",   label: "Needs attention", icon: Inbox,          section: "plan" },
  { href: "/plan/classes",     label: "Classes",         icon: GraduationCap,  section: "plan" },
  { href: "/create",           label: "Copilot",         icon: Sparkles,       section: "create" },
  { href: "/library",          label: "All lessons",     icon: Library,        section: "library" },
  { href: "/library/quizzes",  label: "Quizzes",         icon: ClipboardCheck, section: "library" },
  { href: "/library/media",    label: "Media",           icon: Headphones,     section: "library" },
];
