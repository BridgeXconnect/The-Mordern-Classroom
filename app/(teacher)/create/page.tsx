import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { CopilotView } from "./CopilotView";

export default async function CreatePage() {
  const { userId } = await auth();
  if (!userId) return null;

  const classes = await db.class.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, cefrLevel: true },
  });

  return <CopilotView classes={classes} />;
}
