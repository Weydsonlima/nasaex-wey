---
name: orpc-hooks-pattern
description: Enforce the creation and use of custom hooks for all oRPC procedures within feature directories to ensure cleaner code and reusability.
---

# oRPC Hooks Standard Pattern

This skill ensures that all oRPC route interactions (queries and mutations) are encapsulated within custom hooks. This promotes code reuse, separates concerns, and keeps components clean.

## Mandatory Rules

1.  **Hooks Directory**: Whenever a new route is created or about to be used, check if a `hooks` directory exists within the feature folder (e.g., `src/features/<feature>/hooks`). If it doesn't exist, create it.
2.  **Hook Encapsulation**: ALL oRPC calls MUST be wrapped in custom hooks using `@tanstack/react-query` via the `orpc` instance.
3.  **Naming Convention**:
    *   Relate the hook name to the **entity** it operates on.
    *   If a component works primarily with one entity, create a file specifically for it (e.g., `use-lead.ts`, `use-notification.ts`).
    *   Example: `useCreateLead`, `useUpdateSettings`.
4.  **Client-Side Only**: Start all hook files with `"use client";`.
5.  **Standard Implementation**:
    *   Import `orpc` from `@/lib/orpc`.
    *   Use `useMutation` and `useQuery` from `@tanstack/react-query`.
    *   Include `onSuccess` and `onError` handlers with `toast` from `sonner` for all mutations.
    *   Perform necessary `queryClient.invalidateQueries` calls inside the `onSuccess` handler to keep data synchronized.
6.  **Always Implement**: Even for simple or one-off use cases, implement the hook to allow future reuse.

## Usage in Components

Components should NEVER call `orpc.<router>.<procedure>.useQuery()` or `useMutation()` directly. They should import and use the custom hooks.

### Implementation Example

```typescript
"use client";

import { orpc } from "@/lib/orpc";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function useCreateLead() {
  const queryClient = useQueryClient();

  return useMutation(
    orpc.leads.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: orpc.leads.list.queryKey(),
        });
        toast.success("Lead criado com sucesso!");
      },
      onError: () => {
        toast.error("Erro ao criar lead.");
      },
    }),
  );
}
```

## When to apply this skill
Trigger this skill whenever you are:
- Creating a new tRPC/oRPC route.
- Adding data fetching or mutations to a component.
- Refactoring existing components that call oRPC directly.
