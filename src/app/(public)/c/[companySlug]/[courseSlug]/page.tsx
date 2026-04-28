import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { CoursePublicPage } from "@/features/nasa-route/components/public/course-public-page";

interface Params {
  companySlug: string;
  courseSlug: string;
}

export default async function Page({ params }: { params: Promise<Params> }) {
  const { companySlug, courseSlug } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  const isAuthenticated = !!session?.user;

  return (
    <CoursePublicPage
      companySlug={companySlug}
      courseSlug={courseSlug}
      isAuthenticated={isAuthenticated}
    />
  );
}
