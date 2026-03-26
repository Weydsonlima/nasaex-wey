import { RespondsPage } from "@/features/form/components/responds/responds-page";

export default async function Page({
  params,
}: {
  params: Promise<{ formId: string }>;
}) {
  const { formId } = await params;

  return <RespondsPage formId={formId} />;
}
