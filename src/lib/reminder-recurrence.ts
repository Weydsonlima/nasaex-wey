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

/**
 * Calcula a primeira data de disparo.
 *
 * - Se `dayOfMonth` for fornecido (recorrência MONTHLY com dia fixo):
 *   ignora `firstRemindAt` e usa o próximo mês que contiver esse dia,
 *   começando pelo mês atual. Se o dia já passou no mês corrente, avança para o próximo.
 *
 * - Caso contrário, usa `firstRemindAt` como base e aplica o `remindTime`.
 */
export function buildFirstRemindAt(
  remindTime: string,
  firstRemindAt?: string,
  dayOfMonth?: number,
): Date {
  const [hours, minutes] = remindTime.split(":").map(Number);

  if (dayOfMonth) {
    const now = new Date();
    const candidate = new Date(now.getFullYear(), now.getMonth(), dayOfMonth, hours, minutes, 0, 0);

    // Se o dia já passou neste mês, avança para o próximo mês
    if (candidate <= now) {
      candidate.setMonth(candidate.getMonth() + 1);
    }

    // Garante que o dia existe no mês (ex: dia 31 em fevereiro → último dia)
    const maxDay = new Date(candidate.getFullYear(), candidate.getMonth() + 1, 0).getDate();
    candidate.setDate(Math.min(dayOfMonth, maxDay));

    return candidate;
  }

  if (!firstRemindAt) {
    throw new Error("firstRemindAt é obrigatório quando dayOfMonth não é informado");
  }

  const base = new Date(firstRemindAt);
  base.setHours(hours, minutes, 0, 0);
  return base;
}
