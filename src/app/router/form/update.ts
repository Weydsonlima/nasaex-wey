import { requiredAuthMiddleware } from "@/app/middlewares/auth";
import { base } from "@/app/middlewares/base";
import prisma from "@/lib/prisma";
import z from "zod";

export const updateForm = base
  .use(requiredAuthMiddleware)
  .route({
    method: "PATCH",
    path: "/forms/:formId",
    summary: "Save (update) form content and metadata",
  })
  .input(
    z.object({
      formId: z.string(),
      trackingId: z.string().optional(),
      name: z.string().optional(),
      description: z.string().optional(),
      jsonBlock: z.string(),
    }),
  )
  .handler(async ({ input }) => {
    const { formId, trackingId, name, description, jsonBlock } = input;

    const form = await prisma.form.update({
      where: { formId },
      data: {
        ...(name && { name }),
        ...(description && { description }),
        jsonBlock: jsonBlock as any,
        trackingId,
      },
    });

    return {
      message: "Form updated successfully",
      form,
    };
  });
