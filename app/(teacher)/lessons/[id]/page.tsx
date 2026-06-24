import { redirect } from "next/navigation";
export default async function LessonDetailRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/library/lessons/${id}`);
}
