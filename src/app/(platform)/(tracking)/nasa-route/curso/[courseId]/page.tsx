import { CoursePlayerShell } from "@/features/nasa-route/components/student/course-player-shell";

interface Params {
  courseId: string;
}

export default async function Page({ params }: { params: Promise<Params> }) {
  const { courseId } = await params;
  return <CoursePlayerShell courseId={courseId} />;
}
