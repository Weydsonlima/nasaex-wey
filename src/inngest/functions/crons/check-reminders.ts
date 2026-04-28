import { inngest } from "@/inngest/client";
import prisma from "@/lib/prisma";
import { sendText } from "@/http/uazapi/send-text";
import { computeNextRemindAt } from "@/lib/reminder-recurrence";
import dayjs from "dayjs";
import "dayjs/locale/pt-br";

export type ReminderCreatedEvent = {
  data: { reminderId: string };
};

export const processReminder = inngest.createFunction(
  { id: "process-reminder", retries: 2 },
  { event: "reminder/created" },
  async ({ event, step }) => {
    const { reminderId } = event.data as ReminderCreatedEvent["data"];

    // 1. Carrega o lembrete para saber quando hibernar
    const reminder = await step.run("load-reminder", () =>
      prisma.reminder.findUnique({
        where: { id: reminderId },
        include: {
          lead: { select: { name: true } },
          tracking: {
            select: {
              whatsappInstance: {
                select: { apiKey: true, baseUrl: true, status: true },
              },
            },
          },
        },
      }),
    );

    if (!reminder || !reminder.isActive || !reminder.nextRemindAt) {
      return { skipped: "reminder_inactive_or_not_found" };
    }

    // 2. Hiberna exatamente até o horário do lembrete
    // new Date() garante que funciona mesmo que Inngest serialise o valor como string
    await step.sleepUntil(
      "wait-until-remind-at",
      new Date(reminder.nextRemindAt),
    );

    // 3. Recarrega para confirmar que ainda está ativo (pode ter sido cancelado durante a espera)
    const fresh = await step.run("reload-reminder", () =>
      prisma.reminder.findUnique({
        where: { id: reminderId, isActive: true },
        include: {
          lead: { select: { name: true } },
          tracking: {
            select: {
              whatsappInstance: {
                select: { apiKey: true, baseUrl: true, status: true },
              },
            },
          },
        },
      }),
    );

    if (!fresh) {
      return { skipped: "cancelled_during_sleep" };
    }

    // 4. Envia WhatsApp se houver instância conectada e telefone configurado
    const instance = fresh.tracking?.whatsappInstance;
    const phone = fresh.notifyPhone;
    let sent = false;

    if (phone && instance?.status === "CONNECTED") {
      const message = fresh.message;

      await step.run("send-whatsapp", () =>
        sendText(
          instance.apiKey,
          { number: phone, text: message },
          instance.baseUrl,
        ),
      );

      sent = true;
    }

    // 5. Registra a ocorrência no histórico
    await step.run("save-occurrence", () =>
      prisma.reminderOccurrence.create({
        data: {
          reminderId: fresh.id,
          scheduledAt: new Date(fresh.nextRemindAt!), // reconverte string → Date após serialização
          sent,
          sentAt: sent ? new Date() : null,
        },
      }),
    );

    // 6. Calcula a próxima data e atualiza o lembrete
    // Inngest serializa step.run via JSON, então Date vira string — reconvertemos antes de passar
    const nextRemindAt = computeNextRemindAt({
      recurrenceType: fresh.recurrenceType,
      dayOfMonth: fresh.dayOfMonth,
      nextRemindAt: fresh.nextRemindAt ? new Date(fresh.nextRemindAt) : null,
    });

    await step.run("update-next-remind-at", () =>
      prisma.reminder.update({
        where: { id: fresh.id },
        data: {
          nextRemindAt,
          isActive: nextRemindAt !== null,
        },
      }),
    );

    // 7. Se há próxima ocorrência, dispara novo evento para o job se reagendar
    if (nextRemindAt) {
      await step.run("schedule-next", () =>
        inngest.send({
          name: "reminder/created",
          data: { reminderId: fresh.id },
        }),
      );
    }

    return { sent, nextRemindAt };
  },
);
