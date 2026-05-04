import { requiredAuthMiddleware } from "@/app/middlewares/auth";
import { base } from "@/app/middlewares/base";
import { requireOrgMiddleware } from "@/app/middlewares/org";
import prisma from "@/lib/prisma";
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { logActivity } from "@/lib/activity-logger";

export const updateMindMap = base
  .use(requiredAuthMiddleware)
  .use(requireOrgMiddleware)
  .input(
    z.object({
      mindMapId: z.string(),
      name: z.string().optional(),
      nodes: z.array(z.record(z.string(), z.any())).optional(),
      edges: z.array(z.record(z.string(), z.any())).optional(),
      viewport: z.record(z.string(), z.any()).optional(),
    }),
  )
  .handler(async ({ input, context }) => {
    const { mindMapId, ...data } = input;

    // First verify ownership
    const existing = await prisma.nasaPlannerMindMap.findFirst({
      where: { id: mindMapId, planner: { organizationId: context.org.id } },
    });
    if (!existing) throw new ORPCError("NOT_FOUND", { message: "Mapa não encontrado" });

    const mindMap = await prisma.nasaPlannerMindMap.update({
      where: { id: mindMapId },
      data: data as any,
    });

    // Skip activity log for pure node/edge edits (high-frequency drag/save events).
    // Log only when name changes — represents a real user action worth tracking.
    if (input.name !== undefined && input.name !== existing.name) {
      await logActivity({
        organizationId: context.org.id,
        userId: context.user.id,
        userName: context.user.name,
        userEmail: context.user.email,
        userImage: (context.user as any).image,
        appSlug: "nasa-planner",
        action: "planner.mindmap.renamed",
        actionLabel: `Renomeou o mapa "${existing.name}" para "${input.name}"`,
        resource: input.name,
        resourceId: mindMap.id,
      });
    }

    return { mindMap };
  });
