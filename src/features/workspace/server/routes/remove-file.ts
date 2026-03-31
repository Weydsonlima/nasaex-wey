import { requiredAuthMiddleware } from "@/app/middlewares/auth";
import { base } from "@/app/middlewares/base";
import { requireOrgMiddleware } from "@/app/middlewares/org";
import prisma from "@/lib/prisma";
import { z } from "zod";

export const removeFileAction = base
  .use(requiredAuthMiddleware)
  .use(requireOrgMiddleware)
  .input(
    z.object({
      actionId: z.string(),
      attachmentId: z.string(),
    }),
  )
  .handler(async ({ input, context }) => {
    const { actionId, attachmentId } = input;
    await prisma.action.findUnique({
      where: { id: actionId },
      select: { history: true },
    });

    await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/s3/delete`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        key: attachmentId,
      }),
    });

    const action = await prisma.action.update({
      where: { id: actionId },

      data: { attachments: { delete: { url: attachmentId } } },
    });
    return { action };
  });
