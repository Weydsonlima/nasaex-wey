import { requiredAuthMiddleware } from "@/app/middlewares/auth";
import { base } from "@/app/middlewares/base";
import { requireOrgMiddleware } from "@/app/middlewares/org";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { logActivity } from "@/lib/activity-logger";

export const updateCampaignTask = base
  .use(requiredAuthMiddleware)
  .use(requireOrgMiddleware)
  .input(
    z.object({
      campaignId: z.string(),
      taskId: z.string(),
      title: z.string().optional(),
      description: z.string().optional(),
      assignedTo: z.string().nullable().optional(),
      priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
      status: z.enum(["PENDING", "IN_PROGRESS", "REVIEW", "COMPLETED", "BLOCKED"]).optional(),
      dueDate: z.string().nullable().optional(),
      tags: z.array(z.string()).optional(),
    }),
  )
  .handler(async ({ input, context }) => {
    const { campaignId, taskId, dueDate, ...rest } = input;

    const task = await prisma.nasaCampaignTask.findFirst({
      where: { id: taskId, campaignPlannerId: campaignId, campaignPlanner: { organizationId: context.org.id } },
    });
    if (!task) throw new Error("Tarefa não encontrada.");

    const updated = await prisma.nasaCampaignTask.update({
      where: { id: taskId },
      data: {
        ...rest,
        dueDate: dueDate !== undefined ? (dueDate ? new Date(dueDate) : null) : undefined,
      },
    });

    const isDone = input.status === "COMPLETED" && task.status !== "COMPLETED";
    await logActivity({
      organizationId: context.org.id,
      userId: context.user.id,
      userName: context.user.name,
      userEmail: context.user.email,
      userImage: (context.user as any).image,
      appSlug: "nasa-planner",
      subAppSlug: "planner-tasks",
      featureKey: isDone ? "planner.campaign.task.completed" : "planner.campaign.task.updated",
      action: isDone ? "planner.campaign.task.completed" : "planner.campaign.task.updated",
      actionLabel: isDone
        ? `Concluiu a tarefa "${updated.title}"`
        : `Atualizou a tarefa "${updated.title}"`,
      resourceId: updated.id,
      metadata: { status: input.status, priority: input.priority },
    });

    return { task: updated };
  });
