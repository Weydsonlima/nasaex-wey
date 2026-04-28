import { requiredAuthMiddleware } from "@/app/middlewares/auth";
import { base } from "@/app/middlewares/base";
import { buildFirstRemindAt } from "@/lib/reminder-recurrence";
import prisma from "@/lib/prisma";
import { inngest } from "@/inngest/client";
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
    z
      .object({
        message: z.string().min(1),
        recurrenceType: z.nativeEnum(ReminderRecurrenceType),
        // Para MONTHLY com dia fixo: apenas dayOfMonth + remindTime são necessários
        dayOfMonth: z.number().min(1).max(28).optional(),
        remindTime: z.string().regex(/^\d{2}:\d{2}$/),
        // Obrigatório para ONCE / WEEKLY / BIWEEKLY e MONTHLY sem dayOfMonth
        firstRemindAt: z.string().datetime().optional(),
        notifyPhone: z.string().optional(),
        leadId: z.string().optional(),
        conversationId: z.string().optional(),
        trackingId: z.string().optional(),
      })
      .refine(
        (data) =>
          data.dayOfMonth !== undefined ||
          data.firstRemindAt !== undefined,
        {
          message: "Informe firstRemindAt ou dayOfMonth para calcular o primeiro disparo",
          path: ["firstRemindAt"],
        },
      ),
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

    // Calcula a primeira data de disparo
    const nextRemindAt = buildFirstRemindAt(remindTime, firstRemindAt, dayOfMonth);

    // 1. Persiste o lembrete no banco
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

    // 2. Dispara o job Inngest que hibernará até nextRemindAt e então enviará o WhatsApp
    await inngest.send({
      name: "reminder/created",
      data: { reminderId: reminder.id },
    });

    return { reminder };
  });
