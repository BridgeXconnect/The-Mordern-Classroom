"use client";

import { useEffect, useState } from "react";
import {
  DndContext, closestCenter, PointerSensor, KeyboardSensor,
  useSensor, useSensors, type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, horizontalListSortingStrategy, arrayMove,
  useSortable, sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import type { SentenceOrderQuestion } from "@/types/quiz";

interface Props {
  question: SentenceOrderQuestion;
  value?: number[];
  onAnswer: (order: number[]) => void;
}

interface Tile { id: string; wordIndex: number; }

function SortableTile({ tile, label }: { tile: Tile; label: string }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: tile.id });

  return (
    <button
      ref={setNodeRef}
      type="button"
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        border: isDragging ? "1.5px solid var(--accent-color)" : "1.5px solid var(--border)",
        background: isDragging ? "var(--accent-soft)" : "var(--surface)",
        boxShadow: isDragging ? "var(--shadow)" : "var(--shadow-sm)",
        opacity: isDragging ? 0.85 : 1,
      }}
      className="flex touch-none items-center gap-1.5 rounded-[8px] px-3 py-2 text-[13.5px] font-medium"
      {...attributes}
      {...listeners}
    >
      <GripVertical className="h-3.5 w-3.5" style={{ color: "var(--fg-faint)" }} />
      <span style={{ color: "var(--fg)" }}>{label}</span>
    </button>
  );
}

export function SentenceOrderQ({ question, value, onAnswer }: Props) {
  const initial: Tile[] = (value ?? question.words.map((_, i) => i)).map((wordIndex, k) => ({
    id: `t-${wordIndex}-${k}`,
    wordIndex,
  }));

  const [tiles, setTiles] = useState<Tile[]>(initial);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    onAnswer(tiles.map((t) => t.wordIndex));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tiles]);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setTiles((items) => {
      const oldIndex = items.findIndex((t) => t.id === active.id);
      const newIndex = items.findIndex((t) => t.id === over.id);
      return arrayMove(items, oldIndex, newIndex);
    });
  }

  return (
    <div className="space-y-4">
      <p
        className="font-serif text-[20px] leading-snug"
        style={{ color: "var(--fg)", fontWeight: 420 }}
      >
        {question.prompt}
      </p>
      <p className="font-mono text-[11px] uppercase tracking-[0.1em]" style={{ color: "var(--fg-subtle)" }}>
        Drag the words into the correct order
      </p>

      <div
        className="rounded-[12px] p-4"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
      >
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={tiles.map((t) => t.id)} strategy={horizontalListSortingStrategy}>
            <div className="flex flex-wrap gap-2">
              {tiles.map((t) => (
                <SortableTile key={t.id} tile={t} label={question.words[t.wordIndex]} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      {/* Live sentence preview */}
      <p
        className="rounded-[8px] px-4 py-3 text-[14px] italic"
        style={{ background: "var(--accent-soft)", color: "var(--fg)" }}
      >
        {tiles.map((t) => question.words[t.wordIndex]).join(" ")}
      </p>
    </div>
  );
}
