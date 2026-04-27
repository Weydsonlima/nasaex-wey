"use client";

import { useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc";
import { useFingerprint } from "./use-fingerprint";

export function usePublicEvent(
  slug: string,
  sharerToken?: string | null,
  initialData?: Record<string, unknown>,
) {
  const { fingerprint, ready } = useFingerprint();

  const query = useQuery({
    ...orpc.public.calendar.getPublicEvent.queryOptions({ input: { slug } }),
    enabled: !!slug && !initialData,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    initialData: initialData as any,
  });

  const recordView = useMutation({
    ...orpc.public.calendar.recordView.mutationOptions(),
  });

  useEffect(() => {
    if (!ready || !fingerprint || !slug) return;
    recordView.mutate({
      slug,
      fingerprint,
      sharerToken: sharerToken || undefined,
    });
  }, [ready, fingerprint, slug, sharerToken]);

  return query;
}
