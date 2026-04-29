import { base } from "@/app/middlewares/base";
import { requiredAuthMiddleware } from "@/app/middlewares/auth";
import { requireOrgMiddleware } from "@/app/middlewares/org";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { ORPCError } from "@orpc/server";
import { isCourseManager, requireCourseManager } from "../utils";

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const creatorUpsertCourse = base
  .use(requiredAuthMiddleware)
  .use(requireOrgMiddleware)
  .input(
    z.object({
      id: z.string().optional(),
      slug: z.string().min(2).max(80).regex(SLUG_RE, "Use apenas letras minúsculas, números e hífens"),
      title: z.string().min(2).max(120),
      subtitle: z.string().max(180).optional().nullable(),
      description: z.string().max(8000).optional().nullable(),
      coverUrl: z.string().min(1).optional().nullable(),
      trailerUrl: z.string().min(1).optional().nullable(),
      level: z.enum(["beginner", "intermediate", "advanced"]).default("beginner"),
      format: z.enum(["course", "training", "mentoring"]).default("course"),
      durationMin: z.number().int().min(0).optional().nullable(),
      priceStars: z.number().int().min(0).default(0),
      categoryId: z.string().optional().nullable(),
      rewardSpOnComplete: z.number().int().min(0).default(0),
    }),
  )
  .handler(async ({ input, context }) => {
    const userId = context.user.id;
    const orgId = context.org.id;

    // Permissões: precisa ser membro da org criadora (e a org ativa precisa ser a criadora)
    const canCreate = await isCourseManager(userId, orgId);
    if (!canCreate) {
      // Permitir também membros simples a criar curso (qualquer user com org pode ser criador)
      const member = await prisma.member.findFirst({
        where: { organizationId: orgId, userId },
        select: { id: true },
      });
      if (!member) {
        throw new ORPCError("FORBIDDEN", {
          message: "Você precisa ser membro da organização para criar cursos",
        });
      }
    }

    if (input.id) {
      await requireCourseManager(userId, input.id);

      const updated = await prisma.nasaRouteCourse.update({
        where: { id: input.id },
        data: {
          slug: input.slug,
          title: input.title,
          subtitle: input.subtitle ?? null,
          description: input.description ?? null,
          coverUrl: input.coverUrl ?? null,
          trailerUrl: input.trailerUrl ?? null,
          level: input.level,
          format: input.format,
          durationMin: input.durationMin ?? null,
          priceStars: input.priceStars,
          categoryId: input.categoryId ?? null,
          rewardSpOnComplete: input.rewardSpOnComplete,
        },
      });
      return { course: updated };
    }

    // Cria curso + plano default no mesmo passo. Plano default herda o preço
    // do curso e ainda não tem aulas (nascem do form de aula).
    const created = await prisma.nasaRouteCourse.create({
      data: {
        creatorOrgId: orgId,
        creatorUserId: userId,
        slug: input.slug,
        title: input.title,
        subtitle: input.subtitle ?? null,
        description: input.description ?? null,
        coverUrl: input.coverUrl ?? null,
        trailerUrl: input.trailerUrl ?? null,
        level: input.level,
        format: input.format,
        durationMin: input.durationMin ?? null,
        priceStars: input.priceStars,
        categoryId: input.categoryId ?? null,
        rewardSpOnComplete: input.rewardSpOnComplete,
        isPublished: false,
        plans: {
          create: {
            name: "Acesso completo",
            description: "Acesso a todas as aulas do curso.",
            priceStars: input.priceStars,
            order: 0,
            isDefault: true,
          },
        },
      },
    });
    return { course: created };
  });
