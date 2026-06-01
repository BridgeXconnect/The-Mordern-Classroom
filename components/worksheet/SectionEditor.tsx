"use client";

/**
 * Inline editor for a single worksheet section.
 *
 * Fully controlled: receives a section and emits the updated section via
 * `onChange` on every keystroke. Covers all worksheet section types so a
 * teacher can edit any generated content before exporting to PDF. The parent
 * (WorksheetClient) owns persistence (PUT /api/worksheets/[id]).
 */

import React from "react";
import { Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type {
  WorksheetSection,
  ReadingPassageContent,
  GapFillContent,
  VocabularyContent,
  MultipleChoiceContent,
  MatchingContent,
  WritingPromptContent,
  OrderingContent,
  DiscussionContent,
  InstructionsContent,
  ImageDescriptionContent,
} from "@/types/worksheet";

// ── Small reusable controls ────────────────────────────────────────────────

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <Label className="text-xs font-medium text-muted-foreground">{children}</Label>
  );
}

/** Editable list of plain strings with add / remove. */
function StringList({
  label,
  items,
  onChange,
  placeholder,
  multiline = false,
}: {
  label: string;
  items: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  multiline?: boolean;
}) {
  const update = (i: number, value: string) =>
    onChange(items.map((it, idx) => (idx === i ? value : it)));
  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i));
  const add = () => onChange([...items, ""]);

  return (
    <div className="space-y-1.5">
      <FieldLabel>{label}</FieldLabel>
      {items.map((item, i) => (
        <div key={i} className="flex items-start gap-1.5">
          <span className="mt-2 text-xs text-muted-foreground w-4 shrink-0">{i + 1}.</span>
          {multiline ? (
            <Textarea
              value={item}
              onChange={(e) => update(i, e.target.value)}
              placeholder={placeholder}
              rows={2}
              className="text-sm resize-none"
            />
          ) : (
            <Input
              value={item}
              onChange={(e) => update(i, e.target.value)}
              placeholder={placeholder}
              className="text-sm h-8"
            />
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
            onClick={() => remove(i)}
            aria-label={`Remove ${label} ${i + 1}`}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" className="h-7 text-xs" onClick={add}>
        <Plus className="h-3 w-3 mr-1" /> Add
      </Button>
    </div>
  );
}

// ── Main editor ─────────────────────────────────────────────────────────────

export function SectionEditor({
  section,
  onChange,
}: {
  section: WorksheetSection;
  onChange: (next: WorksheetSection) => void;
}) {
  // Patch the common (type-agnostic) section fields.
  const patchSection = (patch: Partial<WorksheetSection>) =>
    onChange({ ...section, ...patch });

  // Patch the type-specific content. Content is a discriminated union; callers
  // below pass the correct shape for `section.type`, so a single cast is safe.
  const setContent = (patch: Record<string, unknown>) =>
    onChange({
      ...section,
      content: { ...(section.content as object), ...patch } as WorksheetSection["content"],
    });

  return (
    <div className="space-y-3 rounded-lg border bg-muted/20 p-3">
      {/* Common fields */}
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2">
        <div className="space-y-1.5">
          <FieldLabel>Section title</FieldLabel>
          <Input
            value={section.title}
            onChange={(e) => patchSection({ title: e.target.value })}
            className="text-sm h-8"
          />
        </div>
        <div className="space-y-1.5">
          <FieldLabel>Points</FieldLabel>
          <Input
            type="number"
            min={0}
            value={section.points ?? ""}
            onChange={(e) =>
              patchSection({
                points: e.target.value === "" ? undefined : Number(e.target.value),
              })
            }
            className="text-sm h-8 w-20"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <FieldLabel>Instructions</FieldLabel>
        <Textarea
          value={section.instructions ?? ""}
          onChange={(e) => patchSection({ instructions: e.target.value || undefined })}
          rows={2}
          placeholder="Optional instructions shown to the student"
          className="text-sm resize-none"
        />
      </div>

      <div className="h-px bg-border" />

      {/* Type-specific content */}
      <TypeFields section={section} setContent={setContent} />
    </div>
  );
}

function TypeFields({
  section,
  setContent,
}: {
  section: WorksheetSection;
  setContent: (patch: Record<string, unknown>) => void;
}) {
  switch (section.type) {
    case "reading-passage": {
      const c = section.content as ReadingPassageContent;
      const questions = c.comprehensionQuestions ?? [];
      return (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <FieldLabel>Passage</FieldLabel>
            <Textarea
              value={c.passage ?? ""}
              onChange={(e) => setContent({ passage: e.target.value })}
              rows={5}
              className="text-sm resize-none"
            />
          </div>
          <StringList
            label="Comprehension questions"
            items={questions.map((q) => q.question)}
            placeholder="Enter a question"
            onChange={(next) =>
              setContent({
                comprehensionQuestions: next.map((question, i) => ({
                  question,
                  answer: questions[i]?.answer,
                })),
              })
            }
          />
        </div>
      );
    }

    case "gap-fill": {
      const c = section.content as GapFillContent;
      return (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <FieldLabel>Text (use ___ for each gap)</FieldLabel>
            <Textarea
              value={c.text ?? ""}
              onChange={(e) => setContent({ text: e.target.value })}
              rows={4}
              className="text-sm resize-none"
            />
          </div>
          <StringList
            label="Answers"
            items={c.answers ?? []}
            placeholder="Correct word for a gap"
            onChange={(answers) => setContent({ answers })}
          />
          <StringList
            label="Word bank (optional)"
            items={c.wordBank ?? []}
            placeholder="Word to show in the bank"
            onChange={(wordBank) => setContent({ wordBank })}
          />
        </div>
      );
    }

    case "vocabulary": {
      const c = section.content as VocabularyContent;
      const words = c.words ?? [];
      const update = (i: number, patch: Partial<(typeof words)[number]>) =>
        setContent({ words: words.map((w, idx) => (idx === i ? { ...w, ...patch } : w)) });
      return (
        <div className="space-y-2">
          <FieldLabel>Words</FieldLabel>
          {words.map((w, i) => (
            <div key={i} className="flex items-start gap-1.5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 flex-1">
                <Input
                  value={w.word}
                  onChange={(e) => update(i, { word: e.target.value })}
                  placeholder="Word"
                  className="text-sm h-8"
                />
                <Input
                  value={w.definition ?? ""}
                  onChange={(e) => update(i, { definition: e.target.value })}
                  placeholder="Definition"
                  className="text-sm h-8"
                />
                <Input
                  value={w.example ?? ""}
                  onChange={(e) => update(i, { example: e.target.value })}
                  placeholder="Example"
                  className="text-sm h-8"
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                onClick={() => setContent({ words: words.filter((_, idx) => idx !== i) })}
                aria-label={`Remove word ${i + 1}`}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => setContent({ words: [...words, { word: "", definition: "", example: "" }] })}
          >
            <Plus className="h-3 w-3 mr-1" /> Add word
          </Button>
        </div>
      );
    }

    case "multiple-choice": {
      const c = section.content as MultipleChoiceContent;
      const questions = c.questions ?? [];
      const updateQ = (i: number, patch: Partial<(typeof questions)[number]>) =>
        setContent({ questions: questions.map((q, idx) => (idx === i ? { ...q, ...patch } : q)) });
      return (
        <div className="space-y-3">
          <FieldLabel>Questions</FieldLabel>
          {questions.map((q, qi) => (
            <div key={qi} className="space-y-1.5 rounded-md border bg-background p-2">
              <div className="flex items-start gap-1.5">
                <Textarea
                  value={q.question}
                  onChange={(e) => updateQ(qi, { question: e.target.value })}
                  placeholder="Question"
                  rows={2}
                  className="text-sm resize-none"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => setContent({ questions: questions.filter((_, idx) => idx !== qi) })}
                  aria-label={`Remove question ${qi + 1}`}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
              {q.options.map((opt, oi) => (
                <div key={oi} className="flex items-center gap-1.5 pl-2">
                  <input
                    type="radio"
                    name={`mc-${section.id}-${qi}`}
                    checked={q.correctIndex === oi}
                    onChange={() => updateQ(qi, { correctIndex: oi })}
                    aria-label={`Mark option ${String.fromCharCode(65 + oi)} correct`}
                  />
                  <span className="text-xs text-muted-foreground w-4">
                    {String.fromCharCode(65 + oi)}.
                  </span>
                  <Input
                    value={opt}
                    onChange={(e) =>
                      updateQ(qi, {
                        options: q.options.map((o, idx) => (idx === oi ? e.target.value : o)),
                      })
                    }
                    placeholder="Option"
                    className="text-sm h-8"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => {
                      const options = q.options.filter((_, idx) => idx !== oi);
                      const correctIndex =
                        q.correctIndex >= options.length ? Math.max(0, options.length - 1) : q.correctIndex;
                      updateQ(qi, { options, correctIndex });
                    }}
                    aria-label={`Remove option ${String.fromCharCode(65 + oi)}`}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 text-xs ml-2"
                onClick={() => updateQ(qi, { options: [...q.options, ""] })}
              >
                <Plus className="h-3 w-3 mr-1" /> Option
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() =>
              setContent({
                questions: [...questions, { question: "", options: ["", ""], correctIndex: 0 }],
              })
            }
          >
            <Plus className="h-3 w-3 mr-1" /> Add question
          </Button>
        </div>
      );
    }

    case "matching": {
      const c = section.content as MatchingContent;
      const left = c.leftItems ?? [];
      const right = c.rightItems ?? [];
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <StringList
            label="Column A"
            items={left}
            placeholder="Left item"
            onChange={(leftItems) =>
              setContent({
                leftItems,
                correctPairs: leftItems.map((_, i) => [i, i] as [number, number]),
              })
            }
          />
          <StringList
            label="Column B"
            items={right}
            placeholder="Right item"
            onChange={(rightItems) => setContent({ rightItems })}
          />
        </div>
      );
    }

    case "writing-prompt": {
      const c = section.content as WritingPromptContent;
      return (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <FieldLabel>Prompt</FieldLabel>
            <Textarea
              value={c.prompt ?? ""}
              onChange={(e) => setContent({ prompt: e.target.value })}
              rows={3}
              className="text-sm resize-none"
            />
          </div>
          <div className="flex gap-2">
            <div className="space-y-1.5">
              <FieldLabel>Min words</FieldLabel>
              <Input
                type="number"
                min={0}
                value={c.minWords ?? ""}
                onChange={(e) =>
                  setContent({ minWords: e.target.value === "" ? undefined : Number(e.target.value) })
                }
                className="text-sm h-8 w-24"
              />
            </div>
            <div className="space-y-1.5">
              <FieldLabel>Max words</FieldLabel>
              <Input
                type="number"
                min={0}
                value={c.maxWords ?? ""}
                onChange={(e) =>
                  setContent({ maxWords: e.target.value === "" ? undefined : Number(e.target.value) })
                }
                className="text-sm h-8 w-24"
              />
            </div>
          </div>
          <StringList
            label="Guidance points (optional)"
            items={c.guidancePoints ?? []}
            placeholder="A point to guide the student"
            onChange={(guidancePoints) => setContent({ guidancePoints })}
          />
        </div>
      );
    }

    case "ordering": {
      const c = section.content as OrderingContent;
      const items = c.items ?? [];
      return (
        <StringList
          label="Items (shown shuffled; current order is the answer)"
          items={items}
          placeholder="An item to order"
          multiline
          onChange={(next) =>
            setContent({ items: next, correctOrder: next.map((_, i) => i) })
          }
        />
      );
    }

    case "discussion": {
      const c = section.content as DiscussionContent;
      return (
        <StringList
          label="Discussion questions"
          items={c.questions ?? []}
          placeholder="A discussion question"
          multiline
          onChange={(questions) => setContent({ questions })}
        />
      );
    }

    case "image-description": {
      const c = section.content as ImageDescriptionContent;
      return (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <FieldLabel>Image prompt (optional)</FieldLabel>
            <Input
              value={c.imagePrompt ?? ""}
              onChange={(e) => setContent({ imagePrompt: e.target.value })}
              placeholder="Describe the image to generate"
              className="text-sm h-8"
            />
          </div>
          <StringList
            label="Questions"
            items={c.questions ?? []}
            placeholder="A question about the image"
            onChange={(questions) => setContent({ questions })}
          />
        </div>
      );
    }

    case "instructions":
    default: {
      const c = section.content as InstructionsContent;
      return (
        <div className="space-y-1.5">
          <FieldLabel>Text</FieldLabel>
          <Textarea
            value={c.text ?? ""}
            onChange={(e) => setContent({ text: e.target.value })}
            rows={4}
            className="text-sm resize-none"
          />
        </div>
      );
    }
  }
}
