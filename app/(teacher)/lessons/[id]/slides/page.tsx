// TODO Phase 2: Slide builder — generate, edit, Reveal.js preview, PPTX export
export default async function SlidesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div>
      <h1 className="text-2xl font-bold">Slides — Lesson {id}</h1>
      <p className="text-muted-foreground mt-2">TODO: Phase 2</p>
    </div>
  );
}
