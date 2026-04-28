import { CoursePlayerShell } from "@/features/nasa-route/components/student/course-player-shell";

interface Params {
  courseId: string;
  lessonId: string;
}

export default async function Page({ params }: { params: Promise<Params> }) {
  const { courseId, lessonId } = await params;
  return <CoursePlayerShell courseId={courseId} initialLessonId={lessonId} />;
}
