import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { deleteFromR2 } from "@/lib/r2";
import { ownedMediaAsset } from "@/lib/ownership";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const asset = await ownedMediaAsset(id, userId);
  if (!asset) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let r2Warning: string | undefined;
  try {
    await deleteFromR2(asset.url);
  } catch (err) {
    console.error(`R2 delete failed for ${asset.url}:`, err);
    r2Warning = "R2 object could not be deleted; the file may still exist in storage.";
  }

  await db.mediaAsset.delete({ where: { id } });
  return NextResponse.json({ ok: true, ...(r2Warning ? { warning: r2Warning } : {}) });
}
