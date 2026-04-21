import { z } from "zod";
import { requiredAuthMiddleware } from "@/app/middlewares/auth";
import { base } from "@/app/middlewares/base";
import { requireOrgMiddleware } from "@/app/middlewares/org";
import prisma from "@/lib/prisma";

export const getAppointmentsByOrg = base
  .use(requiredAuthMiddleware)
  .use(requireOrgMiddleware)
  .input(
    z.object({
      agendaId: z.string().optional(),
    }),
  )
  .handler(async ({ context, input }) => {
    const appointments = await prisma.appointment.findMany({
      where: {
        agenda: {
          organizationId: context.org.id,
          id: input.agendaId,
        },
      },
      orderBy: { startsAt: "asc" },
    });

    return { appointments };
  });
