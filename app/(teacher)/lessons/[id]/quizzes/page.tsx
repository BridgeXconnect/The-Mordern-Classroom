// TODO Phase 6: Quiz management for a lesson — create PRE/POST quizzes, view results, share links
export default async function LessonQuizzesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div>
      <h1 className="text-2xl font-bold">Quizzes — Lesson {id}</h1>
      <p className="text-muted-foreground mt-2">TODO: Phase 6</p>
    </div>
  );
}
