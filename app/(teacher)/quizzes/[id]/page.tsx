import { redirect } from "next/navigation";
export default async function QuizDetailRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/library/quizzes/${id}/grade`);
}
