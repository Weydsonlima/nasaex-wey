import { base } from "@/app/middlewares/base";
import { requiredAuthMiddleware } from "../../middlewares/auth";
import { requireOrgMiddleware } from "../../middlewares/org";
import prisma from "@/lib/prisma";
import { z } from "zod";

export const listWidgets = base
  .use(requiredAuthMiddleware)
  .use(requireOrgMiddleware)
  .route({
    method: "GET",
    path: "/widgets",
    summary: "List widgets",
  })
  .input(
    z.object({
      organizationId: z.array(z.string()),
    }),
  )
  .handler(async ({ input, context }) => {
    const { organizationId } = input;
    const widgets = await prisma.widget.findMany({
      where: {
        organizationId: {
          in: organizationId,
        },
      },
    });
    return widgets;
  });
