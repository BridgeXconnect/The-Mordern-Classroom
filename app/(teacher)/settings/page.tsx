"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useTheme } from "@/components/ThemeProvider";
import { PageHead, Segmented, Swatch } from "@/components/ui/ef-primitives";
import { Check } from "lucide-react";

type SettingsSection = "profile" | "classes" | "defaults" | "integrations";

const MOCK_CLASSES = [
  { id: "1", name: "IB Year 1",    cefrLevel: "B2", color: "blue",  schedule: "Mon/Wed/Fri 09:00", students: 18 },
  { id: "2", name: "IB Year 2",    cefrLevel: "B2+", color: "teal", schedule: "Tue/Thu 10:00",    students: 16 },
  { id: "3", name: "B1 Intensive", cefrLevel: "B1", color: "amber", schedule: "Mon/Tue/Wed 14:00", students: 12 },
];

const INTEGRATIONS = [
  { id: "openrouter",  label: "OpenRouter",         status: "connected",    sub: "AI generation" },
  { id: "gcp-tts",    label: "Google Cloud TTS",    status: "connected",    sub: "Neural2 voice synthesis" },
  { id: "youtube",    label: "YouTube",             status: "disconnected", sub: "Video search & embed" },
  { id: "classroom",  label: "Google Classroom",    status: "disconnected", sub: "Roster sync" },
  { id: "clerk",      label: "Clerk Auth",          status: "connected",    sub: "Authentication" },
];

export default function SettingsPage() {
  const [section, setSection] = useState<SettingsSection>("profile");
  const { user } = useUser();
  const { theme, setTheme } = useTheme();

  const [defaults, setDefaults] = useState({
    cefrLevel: "B1",
    duration: "45",
    autoQuiz: true,
    autoTTS: false,
    ibAlign: true,
  });

  return (
    <div className="max-w-[920px] mx-auto animate-fade-up">
      <PageHead eyebrow="Settings" title="Settings" />

      <div className="grid gap-6" style={{ gridTemplateColumns: "200px 1fr" }}>
        {/* Sub-nav */}
        <nav className="space-y-0.5">
          {([
            { key: "profile",      label: "Profile" },
            { key: "classes",      label: "Classes" },
            { key: "defaults",     label: "Lesson defaults" },
            { key: "integrations", label: "Integrations" },
          ] as { key: SettingsSection; label: string }[]).map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setSection(key)}
              className="flex w-full items-center rounded-[8px] px-3 py-2 text-[13px] transition-colors text-left"
              style={
                section === key
                  ? { background: "var(--active)", color: "var(--fg)", fontWeight: 500 }
                  : { color: "var(--fg-muted)" }
              }
            >
              {label}
            </button>
          ))}
        </nav>

        {/* Panel */}
        <div className="card p-6">
          {section === "profile" && (
            <div className="space-y-5">
              <h2 className="font-serif text-[18px]" style={{ color: "var(--fg)" }}>Profile</h2>
              {/* Avatar */}
              <div className="flex items-center gap-4">
                <div
                  className="h-14 w-14 rounded-full overflow-hidden flex items-center justify-center text-[20px] font-semibold"
                  style={{ background: "var(--accent-soft)", color: "var(--accent-color)" }}
                >
                  {user?.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={user.imageUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    (user?.firstName?.[0] ?? "T").toUpperCase()
                  )}
                </div>
                <button className="btn btn-ghost btn-sm">Change photo</button>
              </div>

              {/* Name */}
              <div>
                <label className="label-mono block mb-1.5">Display name</label>
                <input
                  type="text"
                  className="field"
                  defaultValue={user?.fullName ?? ""}
                  placeholder="Your name"
                />
              </div>

              {/* Email */}
              <div>
                <label className="label-mono block mb-1.5">Email</label>
                <input
                  type="email"
                  className="field"
                  defaultValue={user?.primaryEmailAddress?.emailAddress ?? ""}
                  disabled
                  style={{ opacity: 0.6 }}
                />
              </div>

              {/* Theme */}
              <div>
                <label className="label-mono block mb-2">Theme</label>
                <Segmented
                  options={[{ value: "light", label: "Light" }, { value: "dark", label: "Dark" }]}
                  value={theme}
                  onChange={(v) => setTheme(v as "light" | "dark")}
                />
              </div>

              <button className="btn btn-primary">Save changes</button>
            </div>
          )}

          {section === "classes" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-[18px]" style={{ color: "var(--fg)" }}>Classes</h2>
                <button className="btn btn-ghost btn-sm">Add a class</button>
              </div>
              <div className="space-y-2">
                {MOCK_CLASSES.map((cls) => (
                  <div key={cls.id} className="flex items-center gap-4 rounded-[10px] p-4" style={{ border: "1px solid var(--border)" }}>
                    <Swatch color={cls.color} size={10} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13.5px] font-medium" style={{ color: "var(--fg)" }}>{cls.name}</p>
                      <p className="font-mono text-[11px]" style={{ color: "var(--fg-subtle)" }}>
                        {cls.schedule} · {cls.students} students · {cls.cefrLevel}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {section === "defaults" && (
            <div className="space-y-5">
              <h2 className="font-serif text-[18px]" style={{ color: "var(--fg)" }}>Lesson defaults</h2>
              <div>
                <label className="label-mono block mb-2">Default CEFR level</label>
                <Segmented
                  options={[{ value: "A2", label: "A2" }, { value: "B1", label: "B1" }, { value: "B2", label: "B2" }]}
                  value={defaults.cefrLevel}
                  onChange={(v) => setDefaults((d) => ({ ...d, cefrLevel: v }))}
                />
              </div>
              <div>
                <label className="label-mono block mb-2">Default lesson length</label>
                <Segmented
                  options={[{ value: "45", label: "45 min" }, { value: "60", label: "60 min" }, { value: "75", label: "75 min" }]}
                  value={defaults.duration}
                  onChange={(v) => setDefaults((d) => ({ ...d, duration: v }))}
                />
              </div>
              {[
                { key: "autoQuiz", label: "Always generate a quiz" },
                { key: "autoTTS",  label: "Auto-generate TTS audio" },
                { key: "ibAlign",  label: "Enforce IB alignment" },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center gap-3 cursor-pointer">
                  <div
                    onClick={() => setDefaults((d) => ({ ...d, [key]: !d[key as keyof typeof d] }))}
                    className="flex h-5 w-5 items-center justify-center rounded-[5px] transition-colors"
                    style={{
                      background: defaults[key as keyof typeof defaults] ? "var(--accent-color)" : "var(--surface-2)",
                      border: `1.5px solid ${defaults[key as keyof typeof defaults] ? "var(--accent-color)" : "var(--border)"}`,
                      cursor: "pointer",
                    }}
                  >
                    {defaults[key as keyof typeof defaults] && <Check className="h-3 w-3" style={{ color: "var(--accent-fg)" }} />}
                  </div>
                  <span className="text-[13px]" style={{ color: "var(--fg)" }}>{label}</span>
                </label>
              ))}
              <button className="btn btn-primary">Save defaults</button>
            </div>
          )}

          {section === "integrations" && (
            <div className="space-y-4">
              <h2 className="font-serif text-[18px]" style={{ color: "var(--fg)" }}>Integrations</h2>
              <div className="space-y-2">
                {INTEGRATIONS.map((int) => (
                  <div key={int.id} className="flex items-center gap-4 rounded-[10px] p-4" style={{ border: "1px solid var(--border)" }}>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13.5px] font-medium" style={{ color: "var(--fg)" }}>{int.label}</p>
                      <p className="text-[12px]" style={{ color: "var(--fg-muted)" }}>{int.sub}</p>
                    </div>
                    <span
                      className="font-mono text-[10.5px] px-2 py-1 rounded-full"
                      style={
                        int.status === "connected"
                          ? { background: "var(--green-bg)", color: "var(--green)" }
                          : { background: "var(--surface-2)", color: "var(--fg-faint)" }
                      }
                    >
                      {int.status === "connected" ? "● Connected" : "○ Not connected"}
                    </span>
                    {int.status !== "connected" && (
                      <button className="btn btn-ghost btn-sm">Connect</button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
