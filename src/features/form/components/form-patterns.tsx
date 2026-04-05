"use client";

import { PatternsSection } from "@/features/admin/components/patterns-section";

export function FormPatterns() {
  return (
    <PatternsSection
      appType="form"
      redirectPath={(id) => `/form/builder/${id}`}
    />
  );
}
