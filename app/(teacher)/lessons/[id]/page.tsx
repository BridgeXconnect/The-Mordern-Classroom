import { redirect } from "next/navigation";
export default function LessonDetailRedirect({ params }: { params: { id: string } }) {
  redirect(`/library/lessons/${params.id}`);
}
