// PUBLIC PAGE — no auth required
// TODO Phase 6: Duolingo-style quiz shell for students
// Accessed via /quiz/[shareToken] — UUID link shared by teacher

export default async function StudentQuizPage({ params }: { params: Promise<{ shareToken: string }> }) {
  const { shareToken } = await params;
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="max-w-lg w-full p-6 text-center">
        <h1 className="text-2xl font-bold">Quiz</h1>
        <p className="text-muted-foreground mt-2">Token: {shareToken}</p>
        <p className="text-muted-foreground mt-1">TODO: Phase 6</p>
      </div>
    </div>
  );
}
