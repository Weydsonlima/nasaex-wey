import { requiredAuthMiddleware } from "@/app/middlewares/auth";
import { base } from "@/app/middlewares/base";
import { buildFirstRemindAt } from "@/lib/reminder-recurrence";
import prisma from "@/lib/prisma";
import { ReminderRecurrenceType } from "@/generated/prisma/enums";
import z from "zod";

export const createReminder = base
  .use(requiredAuthMiddleware)
  .route({
    method: "POST",
    path: "/reminder/create",
    summary: "Create a recurring reminder",
  })
  .input(
    z.object({
      message: z.string().min(1),
      recurrenceType: z.nativeEnum(ReminderRecurrenceType),
      dayOfMonth: z.number().min(1).max(28).optional(),
      remindTime: z.string().regex(/^\d{2}:\d{2}$/),
      firstRemindAt: z.string().datetime(),
      notifyPhone: z.string().optional(),
      leadId: z.string().optional(),
      conversationId: z.string().optional(),
      trackingId: z.string().optional(),
    }),
  )
  .handler(async ({ input, context }) => {
    const {
      message,
      recurrenceType,
      dayOfMonth,
      remindTime,
      firstRemindAt,
      notifyPhone,
      leadId,
      conversationId,
      trackingId,
    } = input;

    const nextRemindAt = buildFirstRemindAt(firstRemindAt, remindTime, dayOfMonth);

    const reminder = await prisma.reminder.create({
      data: {
        createdByUserId: context.user.id,
        message,
        recurrenceType,
        dayOfMonth: dayOfMonth ?? null,
        remindTime,
        notifyPhone: notifyPhone ?? null,
        nextRemindAt,
        leadId: leadId ?? null,
        conversationId: conversationId ?? null,
        trackingId: trackingId ?? null,
      },
    });

    return { reminder };
  });
