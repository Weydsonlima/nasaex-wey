import { base } from "@/app/middlewares/base";
import { requiredAuthMiddleware } from "@/app/middlewares/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

export const markNotificationRead = base
  .use(requiredAuthMiddleware)
  .route({ method: "POST", summary: "Mark notification as read" })
  .input(z.object({ notificationId: z.string() }))
  .output(z.object({ success: z.boolean() }))
  .handler(async ({ input, context }) => {
    await prisma.userNotification.updateMany({
      where: { id: input.notificationId, userId: context.user.id },
      data:  { isRead: true, readAt: new Date() },
    });
    return { success: true };
  });

export const markAllNotificationsRead = base
  .use(requiredAuthMiddleware)
  .route({ method: "POST", summary: "Mark all notifications as read" })
  .input(z.object({}))
  .output(z.object({ count: z.number() }))
  .handler(async ({ context }) => {
    const result = await prisma.userNotification.updateMany({
      where: { userId: context.user.id, isRead: false },
      data:  { isRead: true, readAt: new Date() },
    });
    return { count: result.count };
  });
