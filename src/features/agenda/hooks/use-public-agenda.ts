import { DayOfWeek } from "@/generated/prisma/enums";
import { orpc } from "@/lib/orpc";
import { useQuery } from "@tanstack/react-query";

interface UseQueryPublicAgendaProps {
  orgSlug: string;
  agendaSlug: string;
}

export const useQueryPublicAgenda = ({
  orgSlug,
  agendaSlug,
}: UseQueryPublicAgendaProps) => {
  const { data, isLoading } = useQuery(
    orpc.agenda.public.get.queryOptions({
      input: {
        orgSlug,
        agendaSlug,
      },
    }),
  );

  return {
    agenda: data?.agenda,
    isLoading,
  };
};

interface UseQueryPublicAgendaTimeSlotsProps {
  orgSlug: string;
  agendaSlug: string;
  day: DayOfWeek;
}

export const useQueryPublicAgendaTimeSlots = ({
  orgSlug,
  agendaSlug,
  day,
}: UseQueryPublicAgendaTimeSlotsProps) => {
  const { data, isLoading } = useQuery(
    orpc.agenda.public.getTimeSlots.queryOptions({
      input: {
        orgSlug: orgSlug,
        agendaSlug: agendaSlug,
        day: day,
      },
    }),
  );

  return {
    timeSlots: data?.timeSlots,
    isLoading,
  };
};
