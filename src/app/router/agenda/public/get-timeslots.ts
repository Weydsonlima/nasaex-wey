import { base } from "@/app/middlewares/base";
import prisma from "@/lib/prisma";
import z from "zod";

export const getPublicAgendaTimeSlots = base
  .route({
    method: "GET",
    summary: "Get an agenda",
    tags: ["Agenda"],
  })
  .input(
    z.object({
      day: z.enum([
        "SUNDAY",
        "MONDAY",
        "TUESDAY",
        "WEDNESDAY",
        "THURSDAY",
        "FRIDAY",
        "SATURDAY",
      ]),
      agendaSlug: z.string().min(1, "Agenda slug is required"),
      orgSlug: z.string().min(1, "Organization slug is required"),
    }),
  )
  .handler(async ({ input, errors }) => {
    const timeSlots = await prisma.availabilityTimeSlot.findMany({
      where: {
        availability: {
          agenda: {
            slug: input.agendaSlug,
            organization: {
              slug: input.orgSlug,
            },
            isActive: true,
          },
          dayOfWeek: input.day,
          isActive: true,
        },
      },
      select: {
        id: true,
        startTime: true,
        endTime: true,
        availabilityId: true,
        availability: {
          select: {
            dayOfWeek: true,
          },
        },
      },
      orderBy: {
        order: "asc",
      },
    });

    if (!timeSlots) {
      throw errors.NOT_FOUND({
        message: "Agenda não encontrada",
      });
    }

    return {
      timeSlots,
    };
  });
