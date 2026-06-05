import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { PageHead } from "@/components/ui/ef-primitives";

export default async function MediaLibraryPage() {
  const { userId } = await auth();
  if (!userId) return null;

  const assets = await db.mediaAsset.findMany({
    orderBy: { createdAt: "desc" },
    include: { lesson: { include: { unit: { include: { class: true } } } } } as const,
  });

  const kinds = ["All", "Images", "Infographics", "Video", "Audio"] as const;

  return (
    <div className="max-w-[1120px] mx-auto animate-fade-up">
      <PageHead eyebrow="Library" title="Media" />
      {assets.length === 0 ? (
        <div className="card flex items-center justify-center py-16 text-center">
          <p style={{ color: "var(--fg-muted)" }}>No media assets yet. Generate media from a lesson.</p>
        </div>
      ) : (
        <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))" }}>
          {assets.map((a) => (
            <div key={a.id} className="card overflow-hidden card-hover" style={{ padding: 0 }}>
              <div className="ph relative" style={{ aspectRatio: "4/3" }}>
                <span
                  className="absolute bottom-2 left-2 font-mono text-[9.5px] px-1.5 py-0.5 rounded"
                  style={{ background: "rgba(0,0,0,0.5)", color: "#fff" }}
                >
                  {a.type}
                </span>
              </div>
              <div className="p-3">
                <p className="text-[12.5px] truncate" style={{ color: "var(--fg)" }}>{a.filename ?? a.type}</p>
                <p className="font-mono text-[10.5px]" style={{ color: "var(--fg-subtle)" }}>
                  {a.lesson?.unit?.class?.cefrLevel ?? "—"}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
