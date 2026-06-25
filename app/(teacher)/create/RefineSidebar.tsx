"use client";

import { useState } from "react";
import { X, RotateCcw, Sparkles, AlertTriangle } from "lucide-react";

type AssetKey = "plan" | "slides" | "worksheet" | "quiz" | "media";
type AssetStatus = "pending" | "loading" | "ready" | "error";

interface RefineSidebarProps {
  lessonId: string;
  assetState: Record<AssetKey, AssetStatus>;
  onRefresh: (key: AssetKey, additionalNotes: string) => Promise<void>;
  onClose: () => void;
  onStartOver: () => void;
}

type Message =
  | { kind: "user"; text: string; asset: AssetKey }
  | { kind: "ai"; text: string; status: "ok" | "error" | "info" };

const REFINABLE: { key: AssetKey; label: string }[] = [
  { key: "slides",    label: "Slides" },
  { key: "worksheet", label: "Worksheet" },
  { key: "quiz",      label: "Quiz" },
  { key: "media",     label: "Media" },
];

export function RefineSidebar({
  assetState,
  onRefresh,
  onClose,
  onStartOver,
}: RefineSidebarProps) {
  const [selectedAsset, setSelectedAsset] = useState<AssetKey>("worksheet");
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [planWarning, setPlanWarning] = useState(false);

  function addMsg(m: Message) {
    setMessages((prev) => [...prev, m]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text || busy) return;

    if (selectedAsset === "plan") {
      setPlanWarning(true);
      return;
    }

    setDraft("");
    addMsg({ kind: "user", text, asset: selectedAsset });

    if (assetState[selectedAsset] === "pending") {
      addMsg({ kind: "ai", text: `That asset hasn't been generated yet. Generate it first from the asset list.`, status: "info" });
      return;
    }

    setBusy(true);
    const label = REFINABLE.find(a => a.key === selectedAsset)?.label ?? selectedAsset;
    addMsg({ kind: "ai", text: `Regenerating ${label}…`, status: "info" });
    try {
      await onRefresh(selectedAsset, text);
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = { kind: "ai", text: `${label} updated ✓`, status: "ok" };
        return updated;
      });
    } catch {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = { kind: "ai", text: `Regeneration failed. Try again.`, status: "error" };
        return updated;
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="flex flex-col rounded-[14px] overflow-hidden animate-fade-up"
      style={{
        border: "1px solid var(--border)",
        background: "var(--surface)",
        boxShadow: "var(--shadow-lg)",
        width: 320,
        flexShrink: 0,
        maxHeight: "calc(100vh - 120px)",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 shrink-0"
        style={{ borderBottom: "1px solid var(--border-soft)" }}
      >
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5" style={{ color: "var(--accent-color)" }} />
          <span className="text-[13.5px] font-medium" style={{ color: "var(--fg)" }}>Refine</span>
        </div>
        <button type="button" onClick={onClose} className="btn-icon" style={{ color: "var(--fg-subtle)" }} aria-label="Close">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Asset selector */}
      <div
        className="flex gap-1.5 px-4 py-2.5 shrink-0 flex-wrap"
        style={{ borderBottom: "1px solid var(--border-soft)" }}
      >
        {([{ key: "plan" as AssetKey, label: "Plan" }, ...REFINABLE]).map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => { setSelectedAsset(key); setPlanWarning(key === "plan"); }}
            className="text-[12px] px-2.5 py-1 rounded-full transition-colors"
            style={{
              background: selectedAsset === key ? "var(--accent-color)" : "var(--surface-2)",
              color: selectedAsset === key ? "var(--accent-fg)" : "var(--fg-muted)",
              fontWeight: selectedAsset === key ? 500 : 400,
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Plan warning */}
      {planWarning && (
        <div
          className="mx-4 mt-3 p-3 rounded-[10px] flex gap-2 shrink-0"
          style={{ background: "var(--amber-bg, #fef3c7)", border: "1px solid var(--amber, #d97706)" }}
        >
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "var(--amber, #d97706)" }} />
          <div className="text-[12.5px]" style={{ color: "var(--fg-muted)" }}>
            <p className="font-medium mb-1" style={{ color: "var(--fg)" }}>Plan drives everything</p>
            <p>Changes to the lesson plan require rebuilding all assets. Start over to choose a different direction.</p>
            <button
              type="button"
              onClick={onStartOver}
              className="btn btn-ghost btn-sm mt-2 flex items-center gap-1"
              style={{ color: "var(--fg)" }}
            >
              <RotateCcw className="h-3 w-3" /> Start over
            </button>
          </div>
        </div>
      )}

      {/* Message thread */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5 min-h-0">
        {messages.length === 0 && !planWarning && (
          <p className="text-[12.5px] text-center" style={{ color: "var(--fg-faint)" }}>
            Select an asset and describe what should change.
          </p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.kind === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className="max-w-[85%] rounded-[10px] px-3 py-2 text-[12.5px] leading-relaxed"
              style={{
                background: m.kind === "user"
                  ? "var(--accent-soft)"
                  : m.kind === "ai" && m.status === "error"
                    ? "var(--red-bg, rgba(220,38,38,0.08))"
                    : "var(--surface-2)",
                color: m.kind === "ai" && m.status === "error" ? "var(--red, #dc2626)" : "var(--fg)",
              }}
            >
              {m.kind === "user" ? (
                <p>{m.text}</p>
              ) : (
                <p>{m.text}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="px-4 pb-4 pt-2 shrink-0 space-y-2"
        style={{ borderTop: "1px solid var(--border-soft)" }}
      >
        <textarea
          className="field resize-none text-[13px] w-full"
          placeholder={
            selectedAsset === "plan"
              ? "Plan changes require a full rebuild…"
              : `Describe what should change in the ${REFINABLE.find(a => a.key === selectedAsset)?.label ?? selectedAsset}…`
          }
          rows={3}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") handleSubmit(e as unknown as React.FormEvent); }}
          disabled={busy || selectedAsset === "plan"}
        />
        <button
          type="submit"
          className="btn btn-primary btn-sm w-full"
          disabled={busy || !draft.trim() || selectedAsset === "plan"}
          style={{ opacity: busy || !draft.trim() || selectedAsset === "plan" ? 0.5 : 1 }}
        >
          {busy ? "Regenerating…" : "Regenerate"}
        </button>
      </form>
    </div>
  );
}
