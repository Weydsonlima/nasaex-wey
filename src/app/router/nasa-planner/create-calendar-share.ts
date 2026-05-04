import { requiredAuthMiddleware } from "@/app/middlewares/auth";
import { base } from "@/app/middlewares/base";
import { requireOrgMiddleware } from "@/app/middlewares/org";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { logActivity } from "@/lib/activity-logger";

export const createCalendarShare = base
  .use(requiredAuthMiddleware)
  .use(requireOrgMiddleware)
  .input(
    z.object({
      plannerId: z.string(),
      expiresAt: z.string().optional(),
    }),
  )
  .handler(async ({ input, context }) => {
    await prisma.nasaPlanner.findFirstOrThrow({
      where: { id: input.plannerId, organizationId: context.org.id },
    });

    // Deactivate old shares
    await prisma.nasaPlannerCalendarShare.updateMany({
      where: { plannerId: input.plannerId, isActive: true },
      data: { isActive: false },
    });

    const share = await prisma.nasaPlannerCalendarShare.create({
      data: {
        plannerId: input.plannerId,
        isActive: true,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : undefined,
      },
    });

    await logActivity({
      organizationId: context.org.id,
      userId: context.user.id,
      userName: context.user.name,
      userEmail: context.user.email,
      userImage: (context.user as any).image,
      appSlug: "nasa-planner",
      subAppSlug: "planner-share",
      featureKey: "planner.calendar.shared",
      action: "planner.calendar.shared",
      actionLabel: "Gerou link de compartilhamento do calendário",
      resourceId: share.id,
      metadata: { plannerId: input.plannerId },
    });

    return { share };
  });
