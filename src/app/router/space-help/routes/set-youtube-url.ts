import { base } from "@/app/middlewares/base";
import { requiredAuthMiddleware } from "@/app/middlewares/auth";
import { requireOrgMiddleware } from "@/app/middlewares/org";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { requireModerator } from "../utils";

const YT_REGEX = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/i;

export const setYoutubeUrl = base
  .use(requiredAuthMiddleware)
  .use(requireOrgMiddleware)
  .input(
    z.object({
      target: z.enum(["feature", "lesson"]),
      id: z.string(),
      youtubeUrl: z
        .string()
        .refine((v) => v === "" || YT_REGEX.test(v), "URL inválida do YouTube")
        .nullable()
        .or(z.literal("")),
    }),
  )
  .handler(async ({ input, context }) => {
    await requireModerator(context.user.id, context.org.id);
    const value = input.youtubeUrl && input.youtubeUrl.length > 0 ? input.youtubeUrl : null;
    if (input.target === "feature") {
      await prisma.spaceHelpFeature.update({
        where: { id: input.id },
        data: { youtubeUrl: value, updatedById: context.user.id },
      });
    } else {
      await prisma.spaceHelpLesson.update({
        where: { id: input.id },
        data: { youtubeUrl: value },
      });
    }
    return { success: true, youtubeUrl: value };
  });
