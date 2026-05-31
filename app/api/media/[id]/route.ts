import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { deleteFromR2 } from "@/lib/r2";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const asset = await db.mediaAsset.findUnique({ where: { id } });
  if (!asset) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Delete from R2 first, then DB (tolerate R2 errors — DB record is the source of truth)
  try {
    await deleteFromR2(asset.url);
  } catch {
    // Log but don't fail — R2 object may already be gone
    console.warn(`R2 delete failed for ${asset.url}`);
  }

  await db.mediaAsset.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
