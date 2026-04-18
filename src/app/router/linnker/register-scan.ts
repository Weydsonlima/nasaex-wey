import { base } from "@/app/middlewares/base";
import prisma from "@/lib/prisma";
import { LeadSource } from "@/generated/prisma/enums";
import z from "zod";

export const registerLinnkerScan = base
  .route({
    method: "POST",
    path: "/public/linnker/:slug/scan",
    summary: "Register a QR code scan and optionally create a lead",
  })
  .input(
    z.object({
      slug: z.string(),
      name: z.string().optional(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      latitude: z.number().optional(),
      longitude: z.number().optional(),
    }),
  )
  .handler(async ({ input, errors, context }) => {
    const { slug, name, email, phone, latitude, longitude } = input;

    const page = await prisma.linnkerPage.findUnique({
      where: { slug, isPublished: true },
    });

    if (!page) throw errors.NOT_FOUND({ message: "Página não encontrada" });

    let leadId: string | undefined;

    if (name || email || phone) {
      const tracking = await prisma.tracking.findFirst({
        where: { organizationId: page.organizationId },
        orderBy: { createdAt: "asc" },
      });

      if (tracking) {
        const status = await prisma.status.findFirst({
          where: { trackingId: tracking.id },
          orderBy: { order: "asc" },
        });

        if (status) {
          const existingLead = email
            ? await prisma.lead.findFirst({ where: { email, trackingId: tracking.id } })
            : phone
              ? await prisma.lead.findFirst({ where: { phone, trackingId: tracking.id } })
              : null;

          if (existingLead) {
            leadId = existingLead.id;
          } else {
            const lead = await prisma.lead.create({
              data: {
                name: name ?? "Lead via QR Code",
                email,
                phone,
                trackingId: tracking.id,
                statusId: status.id,
                source: LeadSource.OTHER,
              },
            });
            leadId = lead.id;
          }
        }
      }
    }

    await prisma.linnkerScan.create({
      data: {
        pageId: page.id,
        leadId,
        name,
        email,
        phone,
        latitude,
        longitude,
      },
    });

    return { message: "Scan registrado", leadId };
  });
