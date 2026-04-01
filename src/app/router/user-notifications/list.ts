import { base } from "@/app/middlewares/base";
import { requiredAuthMiddleware } from "@/app/middlewares/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

export const listNotifications = base
  .use(requiredAuthMiddleware)
  .route({ method: "GET", summary: "List my notifications" })
  .input(z.object({
    unreadOnly: z.boolean().optional().default(false),
    limit:      z.coerce.number().int().positive().max(50).default(20),
  }))
  .output(z.object({
    notifications: z.array(z.object({
      id:        z.string(),
      type:      z.string(),
      title:     z.string(),
      body:      z.string(),
      appKey:    z.string().nullable(),
      actionUrl: z.string().nullable(),
      isRead:    z.boolean(),
      createdAt: z.string(),
    })),
    unreadCount: z.number(),
  }))
  .handler(async ({ input, context }) => {
    const userId = context.user.id;

    const [notifications, unreadCount] = await Promise.all([
      prisma.userNotification.findMany({
        where: {
          userId,
          ...(input.unreadOnly ? { isRead: false } : {}),
        },
        orderBy: { createdAt: "desc" },
        take: input.limit,
        select: {
          id: true, type: true, title: true, body: true,
          appKey: true, actionUrl: true, isRead: true, createdAt: true,
        },
      }),
      prisma.userNotification.count({
        where: { userId, isRead: false },
      }),
    ]);

    return {
      notifications: notifications.map((n) => ({
        id:        n.id,
        type:      n.type,
        title:     n.title,
        body:      n.body,
        appKey:    n.appKey ?? null,
        actionUrl: n.actionUrl ?? null,
        isRead:    n.isRead,
        createdAt: n.createdAt.toISOString(),
      })),
      unreadCount,
    };
  });
