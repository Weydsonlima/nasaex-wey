import { ReminderRecurrenceType } from "@/generated/prisma/enums";

type ReminderBase = {
  recurrenceType: ReminderRecurrenceType;
  dayOfMonth: number | null;
  nextRemindAt: Date | null;
};

export function computeNextRemindAt(reminder: ReminderBase): Date | null {
  const { recurrenceType, dayOfMonth, nextRemindAt } = reminder;

  if (!nextRemindAt) return null;

  const base = new Date(nextRemindAt);

  switch (recurrenceType) {
    case ReminderRecurrenceType.ONCE:
      return null;

    case ReminderRecurrenceType.WEEKLY: {
      const next = new Date(base);
      next.setDate(next.getDate() + 7);
      return next;
    }

    case ReminderRecurrenceType.BIWEEKLY: {
      const next = new Date(base);
      next.setDate(next.getDate() + 14);
      return next;
    }

    case ReminderRecurrenceType.MONTHLY: {
      const next = new Date(base);
      next.setMonth(next.getMonth() + 1);

      if (dayOfMonth) {
        const maxDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
        next.setDate(Math.min(dayOfMonth, maxDay));
      }

      return next;
    }
  }
}

export function buildFirstRemindAt(firstRemindAt: string, remindTime: string, dayOfMonth?: number): Date {
  const base = new Date(firstRemindAt);
  const [hours, minutes] = remindTime.split(":").map(Number);

  base.setHours(hours, minutes, 0, 0);

  if (dayOfMonth) {
    const maxDay = new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate();
    base.setDate(Math.min(dayOfMonth, maxDay));
  }

  return base;
}
