import {
  LayoutDashboard,
  GraduationCap,
  Brain,
  Library,
  FileText,
  PresentationIcon,
  Video,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  section: "pinned" | "tools";
  badge?: string;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard",    icon: LayoutDashboard, section: "pinned" },
  { href: "/classes",   label: "Classes",      icon: GraduationCap,   section: "tools" },
  { href: "/quizzes",   label: "Quizzes",      icon: Brain,           section: "tools" },
  { href: "/media",     label: "Media",        icon: Library,         section: "tools" },
  { href: "/lessons",   label: "Worksheets",   icon: FileText,        section: "tools" },
  { href: "/slides",    label: "Slides",       icon: PresentationIcon,section: "tools" },
  { href: "/videos",    label: "Video",        icon: Video,           section: "tools" },
];
