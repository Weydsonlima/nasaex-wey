import { requiredAuthMiddleware } from "@/app/middlewares/auth";
import { base } from "@/app/middlewares/base";
import { requireOrgMiddleware } from "@/app/middlewares/org";
import prisma from "@/lib/prisma";
import { logOrgActivity } from "@/lib/org-activity-log";
import { z } from "zod";

export const updateActionFields = base
  .use(requiredAuthMiddleware)
  .use(requireOrgMiddleware)
  .input(
    z.object({
      actionId: z.string(),
      attachments: z.array(z.record(z.string(), z.any())).optional(),
      links: z.array(z.record(z.string(), z.any())).optional(),
      youtubeUrl: z.string().nullable().optional(),
      coverImage: z.string().nullable().optional(),
      isArchived: z.boolean().optional(),
      isFavorited: z.boolean().optional(),
    }),
  )
  .handler(async ({ input, context }) => {
    const { actionId, ...data } = input;
    const existing = await prisma.action.findUnique({
      where: { id: actionId },
      select: { workspaceId: true, columnId: true },
    });
    const changedFields = Object.keys(data).filter(
      (key) => (data as Record<string, unknown>)[key] !== undefined,
    );
    const action = await prisma.action.update({
      where: { id: actionId },
      data,
    });

    if (changedFields.length > 0) {
      await logOrgActivity({
        organizationId: context.org.id,
        userId: context.user.id,
        userName: context.user.name ?? "Usuário",
        userEmail: context.user.email ?? "",
        action: "action.updated",
        resource: "action",
        resourceId: actionId,
        metadata: {
          changes: changedFields,
          workspaceId: existing?.workspaceId,
          columnId: existing?.columnId,
        },
      });
    }

    return { action };
  });
