import { Frown } from "lucide-react";

export function QuizUnavailable({ title, message }: { title: string; message: string }) {
  return (
    <main
      className="flex min-h-screen items-center justify-center p-6"
      style={{ background: "var(--bg)" }}
    >
      <div
        className="flex max-w-sm flex-col items-center gap-4 text-center rounded-[18px] p-10"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow)",
        }}
      >
        <div
          className="flex h-11 w-11 items-center justify-center rounded-[12px]"
          style={{ background: "var(--surface-2)" }}
        >
          <Frown className="h-5 w-5" style={{ color: "var(--fg-subtle)" }} />
        </div>
        <div>
          <h1 className="font-serif text-[22px] mb-1" style={{ color: "var(--fg)", fontWeight: 420 }}>
            {title}
          </h1>
          <p className="text-[13px]" style={{ color: "var(--fg-muted)" }}>{message}</p>
        </div>
      </div>
    </main>
  );
}
