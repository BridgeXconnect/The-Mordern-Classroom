"use client";

import { useState, useEffect, useRef } from "react";
import { Check, X, Pencil } from "lucide-react";

interface Props {
  value: string;
  onSave: (newValue: string) => Promise<void>;
  multiline?: boolean;
  displayAs?: "h1" | "p" | "span";
  className?: string;
  inputClassName?: string;
  displayClassName?: string;
}

export function InlineEditField({
  value,
  onSave,
  multiline = false,
  displayAs: Tag = "span",
  className = "",
  inputClassName = "",
  displayClassName = "",
}: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [displayValue, setDisplayValue] = useState(value);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement & HTMLTextAreaElement>(null);

  // Sync display value when the server prop updates (after router.refresh())
  useEffect(() => { setDisplayValue(value); }, [value]);

  function startEdit() {
    setDraft(displayValue);
    setEditing(true);
    setError(null);
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  async function save() {
    const trimmed = draft.trim();
    if (!trimmed || trimmed === displayValue) { setEditing(false); return; }
    setSaving(true);
    setError(null);
    try {
      await onSave(trimmed);
      setDisplayValue(trimmed);
      setEditing(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed. Try again.");
    } finally {
      setSaving(false);
    }
  }

  function cancel() {
    setDraft(displayValue);
    setEditing(false);
    setError(null);
  }

  if (editing) {
    const sharedProps = {
      value: draft,
      onChange: (e: React.ChangeEvent<HTMLInputElement & HTMLTextAreaElement>) => setDraft(e.target.value),
      className: `field text-[13.5px] ${inputClassName}`,
      onKeyDown: (e: React.KeyboardEvent) => {
        if (e.key === "Escape") cancel();
        if (!multiline && e.key === "Enter") save();
        if (multiline && (e.metaKey || e.ctrlKey) && e.key === "Enter") save();
      },
    };
    return (
      <div className={`flex flex-col gap-1.5 ${className}`}>
        {multiline ? (
          <textarea {...sharedProps} ref={inputRef as React.RefObject<HTMLTextAreaElement>} rows={4} className={`field resize-none text-[13.5px] ${inputClassName}`} />
        ) : (
          <input {...sharedProps} ref={inputRef as React.RefObject<HTMLInputElement>} type="text" />
        )}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={save}
            disabled={saving || !draft.trim()}
            className="btn btn-primary btn-sm flex items-center gap-1"
            style={{ opacity: saving || !draft.trim() ? 0.6 : 1 }}
          >
            <Check className="h-3 w-3" /> {saving ? "Saving…" : "Save"}
          </button>
          <button type="button" onClick={cancel} className="btn btn-ghost btn-sm flex items-center gap-1">
            <X className="h-3 w-3" /> Cancel
          </button>
          {!multiline && (
            <span className="text-[11px]" style={{ color: "var(--fg-faint)" }}>Enter to save · Esc to cancel</span>
          )}
          {error && <p className="text-[11.5px] w-full" style={{ color: "var(--red, #dc2626)" }}>{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className={`group flex items-start gap-1.5 ${className}`}>
      <Tag className={displayClassName}>{displayValue}</Tag>
      <button
        type="button"
        onClick={startEdit}
        className="opacity-0 group-hover:opacity-100 transition-opacity btn-icon shrink-0 mt-0.5"
        style={{ color: "var(--fg-faint)" }}
        aria-label="Edit"
      >
        <Pencil className="h-3 w-3" />
      </button>
    </div>
  );
}
