import { useLocale } from "react-aria";
import { useQueryPublicAgendaTimeSlots } from "../../hooks/use-public-agenda";
import { DayOfWeek } from "@/generated/prisma/enums";
import dayjs from "dayjs";
import "dayjs/locale/pt-br";

interface Props {
  selectedDate: Date;
  orgSlug: string;
  agendaSlug: string;
  slotDuration: number;
}

export function TimeTable({
  selectedDate,
  orgSlug,
  agendaSlug,
  slotDuration,
}: Props) {
  const { locale } = useLocale();
  const { timeSlots } = useQueryPublicAgendaTimeSlots({
    orgSlug,
    agendaSlug,
    day: dayjs(selectedDate)
      .locale("en")
      .format("dddd")
      .toUpperCase() as DayOfWeek,
  });

  console.log(timeSlots);

  return (
    <div>
      <p className="text-base font-semibold">
        {dayjs(selectedDate).locale(locale).format("ddd")}{" "}
        <span className="text-sm text-muted-foreground">
          {dayjs(selectedDate).locale(locale).format("D MMMM YYYY")}
        </span>
      </p>
    </div>
  );
}
