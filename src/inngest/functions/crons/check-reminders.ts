import { inngest } from "@/inngest/client";
import prisma from "@/lib/prisma";
import { sendText } from "@/http/uazapi/send-text";
import { computeNextRemindAt } from "@/lib/reminder-recurrence";
import dayjs from "dayjs";
import "dayjs/locale/pt-br";

export const checkReminders = inngest.createFunction(
  { id: "check-reminders", retries: 1 },
  { cron: "0 * * * *" },
  async () => {
    const now = new Date();

    const dueReminders = await prisma.reminder.findMany({
      where: {
        isActive: true,
        nextRemindAt: { lte: now },
      },
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
    });

    let sent = 0;
    let skipped = 0;

    for (const reminder of dueReminders) {
      const instance = reminder.tracking?.whatsappInstance;
      const phone = reminder.notifyPhone;

      if (phone && instance && instance.status === "CONNECTED") {
        const leadName = reminder.lead?.name ?? "Lead";
        const scheduledTime = dayjs(reminder.nextRemindAt)
          .locale("pt-br")
          .format("DD/MM/YYYY [às] HH:mm");

        const message = [
          `🔔 *Lembrete — ${leadName}*`,
          ``,
          reminder.message,
          ``,
          `🗓 Agendado para: ${scheduledTime}`,
        ].join("\n");

        await sendText(
          instance.apiKey,
          { number: phone, text: message },
          instance.baseUrl,
        );

        sent++;
      } else {
        skipped++;
      }

      await prisma.reminderOccurrence.create({
        data: {
          reminderId: reminder.id,
          scheduledAt: reminder.nextRemindAt!,
          sent: !!(phone && instance && instance.status === "CONNECTED"),
          sentAt: phone && instance && instance.status === "CONNECTED" ? now : null,
        },
      });

      const nextRemindAt = computeNextRemindAt(reminder);

      await prisma.reminder.update({
        where: { id: reminder.id },
        data: {
          nextRemindAt,
          isActive: nextRemindAt !== null,
        },
      });
    }

    return { processed: dueReminders.length, sent, skipped };
  },
);
