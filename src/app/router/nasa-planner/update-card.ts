import { requiredAuthMiddleware } from "@/app/middlewares/auth";
import { base } from "@/app/middlewares/base";
import { requireOrgMiddleware } from "@/app/middlewares/org";
import prisma from "@/lib/prisma";
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { logActivity } from "@/lib/activity-logger";

export const updateCard = base
  .use(requiredAuthMiddleware)
  .use(requireOrgMiddleware)
  .input(
    z.object({
      cardId: z.string(),
      title: z.string().optional(),
      description: z.string().optional(),
      status: z
        .enum(["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"])
        .optional(),
      priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
      assigneeIds: z.array(z.string()).optional(),
      dueDate: z.string().nullable().optional(),
    }),
  )
  .handler(async ({ input, context }) => {
    const { cardId, dueDate, ...data } = input;

    // First verify ownership
    const existing = await prisma.nasaPlannerCard.findFirst({
      where: { id: cardId, mindMap: { planner: { organizationId: context.org.id } } },
    });
    if (!existing) throw new ORPCError("NOT_FOUND", { message: "Card não encontrado" });

    const card = await prisma.nasaPlannerCard.update({
      where: { id: cardId },
      data: {
        ...data,
        ...(dueDate !== undefined
          ? { dueDate: dueDate ? new Date(dueDate) : null }
          : {}),
      },
    });

    const completed = data.status === "COMPLETED";
    await logActivity({
      organizationId: context.org.id,
      userId: context.user.id,
      userName: context.user.name,
      userEmail: context.user.email,
      userImage: (context.user as any).image,
      appSlug: "nasa-planner",
      action: completed ? "planner.card.completed" : "planner.card.updated",
      actionLabel: completed
        ? `Concluiu o card "${card.title}"`
        : `Atualizou o card "${card.title}"`,
      resource: card.title,
      resourceId: card.id,
      metadata: { status: data.status, priority: data.priority },
    });

    return { card };
  });
