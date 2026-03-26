import { FormBuilder } from "@/features/form/components/form-builder";

export default async function Page({
  params,
}: {
  params: Promise<{ formId: string }>;
}) {
  const { formId } = await params;
  return <FormBuilder formId={formId} />;
}
