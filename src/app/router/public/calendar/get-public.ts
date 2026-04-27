import { base } from "@/app/middlewares/base";
import prisma from "@/lib/prisma";
import { z } from "zod";

export const getPublicEvent = base
  .input(z.object({ slug: z.string().min(1) }))
  .handler(async ({ input, errors }) => {
    const event = await prisma.action.findFirst({
      where: {
        publicSlug: input.slug,
        isPublic: true,
        isGuestDraft: false,
        publishedAt: { not: null },
      },
      include: {
        organization: { select: { id: true, name: true, logo: true } },
        user: { select: { id: true, name: true, image: true } },
        participants: {
          include: { user: { select: { id: true, name: true, image: true } } },
        },
        tags: { include: { tag: { select: { id: true, name: true, color: true } } } },
      },
    });

    if (!event) {
      throw errors.NOT_FOUND({ message: "Evento não encontrado" });
    }

    const related = await prisma.action.findMany({
      where: {
        isPublic: true,
        isArchived: false,
        isGuestDraft: false,
        publishedAt: { not: null },
        id: { not: event.id },
        ...(event.eventCategory ? { eventCategory: event.eventCategory } : {}),
      },
      orderBy: { startDate: "asc" },
      take: 4,
      select: {
        id: true,
        publicSlug: true,
        title: true,
        coverImage: true,
        startDate: true,
        city: true,
        state: true,
        eventCategory: true,
      },
    });

    return { event, isLikedByMe: false, related };
  });
