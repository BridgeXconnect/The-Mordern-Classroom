// TODO Phase 3: Worksheet editor — section blocks, generate, PDF export preview
export default async function WorksheetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div>
      <h1 className="text-2xl font-bold">Worksheet — Lesson {id}</h1>
      <p className="text-muted-foreground mt-2">TODO: Phase 3</p>
    </div>
  );
}
