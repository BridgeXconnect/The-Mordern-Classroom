"use client";

import { useEffect, useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  arrayMove,
  useSortable,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SentenceOrderQuestion } from "@/types/quiz";

interface Props {
  question: SentenceOrderQuestion;
  value?: number[];
  onAnswer: (order: number[]) => void;
}

// Each tile keeps its original word index as a stable id.
interface Tile {
  id: string;
  wordIndex: number;
}

function SortableTile({ tile, label }: { tile: Tile; label: string }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: tile.id });

  return (
    <button
      ref={setNodeRef}
      type="button"
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "flex touch-none items-center gap-1.5 rounded-lg border-2 border-border bg-card px-3 py-2 text-sm font-medium shadow-sm",
        isDragging && "z-10 border-primary opacity-80 shadow-md"
      )}
      {...attributes}
      {...listeners}
    >
      <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
      {label}
    </button>
  );
}

export function SentenceOrderQ({ question, value, onAnswer }: Props) {
  // Initial display order: the shuffled order as given by `words`.
  const initial: Tile[] = (value ?? question.words.map((_, i) => i)).map((wordIndex, k) => ({
    id: `t-${wordIndex}-${k}`,
    wordIndex,
  }));

  const [tiles, setTiles] = useState<Tile[]>(initial);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Report the current order (as word indices) on every change.
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
      <p className="text-lg font-medium leading-snug">{question.prompt}</p>
      <p className="text-xs text-muted-foreground">Drag the words into the correct order.</p>

      <div className="rounded-xl border bg-muted/30 p-4">
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

      <p className="rounded-lg bg-accent/50 px-3 py-2 text-sm">
        {tiles.map((t) => question.words[t.wordIndex]).join(" ")}
      </p>
    </div>
  );
}
