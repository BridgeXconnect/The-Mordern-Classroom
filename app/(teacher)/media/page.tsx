import { auth } from "@clerk/nextjs/server";
import { MediaClient } from "./MediaClient";

export default async function MediaPage() {
  const { userId } = await auth();
  if (!userId) return null;
  return <MediaClient />;
}
