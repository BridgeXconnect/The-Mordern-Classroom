import Link from "next/link";
import { PageHead, CefrBadge } from "@/components/ui/ef-primitives";
import { ArrowRight, FileText, BookOpen, Volume2, MessageSquare, Brain, ClipboardCheck, Search, Sunrise } from "lucide-react";

const TEMPLATES = [
  { id: "1", title: "Reading + Debate",      icon: BookOpen,        cefr: "B1–B2", blurb: "Structured reading with paired debate using ATL communication skills.", skills: ["Communication", "Thinking"], assets: ["Lesson plan", "Worksheet", "Quiz"] },
  { id: "2", title: "Listening Task",        icon: Volume2,         cefr: "A2–B1", blurb: "Authentic listening clip with comprehension and vocabulary building.", skills: ["Communication"], assets: ["Lesson plan", "Media", "Worksheet"] },
  { id: "3", title: "Grammar Focus",         icon: FileText,        cefr: "A2–B2", blurb: "Guided discovery of a grammar point with controlled practice.", skills: ["Self-management"], assets: ["Lesson plan", "Slides", "Worksheet", "Quiz"] },
  { id: "4", title: "Vocabulary Builder",    icon: Brain,           cefr: "A2–B1", blurb: "Spaced repetition vocabulary introduction with gap-fill and writing.", skills: ["Thinking"], assets: ["Worksheet", "Quiz"] },
  { id: "5", title: "Speaking Role-play",    icon: MessageSquare,   cefr: "B1–B2", blurb: "Scenario-based speaking with structured role-cards and self-evaluation.", skills: ["Communication", "Social"], assets: ["Lesson plan", "Slides"] },
  { id: "6", title: "IB Exam Prep — P1",    icon: ClipboardCheck,  cefr: "B2",    blurb: "Timed Paper 1 text type practice with annotated model responses.", skills: ["Thinking", "Self-management"], assets: ["Lesson plan", "Worksheet"] },
  { id: "7", title: "Project / Inquiry",    icon: Search,          cefr: "B1–B2", blurb: "Inquiry cycle from question to presentation using ATL research skills.", skills: ["Research", "Communication"], assets: ["Lesson plan", "Slides"] },
  { id: "8", title: "Warm-up Activity",     icon: Sunrise,         cefr: "A2–B2", blurb: "5–10 min low-stakes activator to prime the lesson topic.", skills: ["Communication"], assets: ["Slides"] },
];

export default function TemplatesPage() {
  return (
    <div className="max-w-[1000px] mx-auto animate-fade-up">
      <PageHead
        eyebrow="Create"
        title="Templates"
        sub="Start from a proven lesson structure instead of a blank page."
      />
      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}
      >
        {TEMPLATES.map((t) => {
          const Icon = t.icon;
          return (
            <div key={t.id} className="card card-hover flex flex-col p-5 gap-3">
              <div className="flex items-start justify-between gap-2">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-[8px] shrink-0"
                  style={{ background: "var(--accent-soft)" }}
                >
                  <Icon className="h-4.5 w-4.5" style={{ color: "var(--accent-color)" }} />
                </div>
                <CefrBadge level={t.cefr} />
              </div>
              <div>
                <h3 className="font-serif text-[16px] mb-1" style={{ color: "var(--fg)", fontWeight: 500 }}>
                  {t.title}
                </h3>
                <p className="text-[12.5px] leading-relaxed" style={{ color: "var(--fg-muted)" }}>{t.blurb}</p>
              </div>
              <div className="flex flex-wrap gap-1">
                {t.skills.map((s) => <span key={s} className="chip">{s}</span>)}
              </div>
              <div
                className="flex items-center justify-between pt-3"
                style={{ borderTop: "1px solid var(--border-soft)" }}
              >
                <div className="flex gap-1.5 font-mono text-[10.5px]" style={{ color: "var(--fg-faint)" }}>
                  {t.assets.join(" · ")}
                </div>
                <Link
                  href={`/create?template=${t.id}`}
                  className="btn btn-ghost btn-sm flex items-center gap-1"
                >
                  Use <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
