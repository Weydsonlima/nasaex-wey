import { requiredAuthMiddleware } from "@/app/middlewares/auth";
import { base } from "@/app/middlewares/base";
import { LeadAction } from "@/generated/prisma/enums";
import prisma from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/client";
import z from "zod";

export const importLeadsBatch = base
  .use(requiredAuthMiddleware)
  .input(
    z.object({
      leads: z.array(
        z.object({
          name: z.string(),
          phone: z.string().optional(),
          email: z.string().optional(),
          document: z.string().optional(),
          description: z.string().optional(),
          amount: z.number().optional(),
          temperature: z.enum(["COLD", "WARM", "HOT", "VERY_HOT"]).optional(),
          source: z
            .enum(["DEFAULT", "WHATSAPP", "FORM", "AGENDA", "OTHER"])
            .optional(),
          profile: z.string().optional(),
        }),
      ),
      trackingId: z.string(),
      statusId: z.string(),
    }),
  )
  .handler(async ({ input, context, errors }) => {
    const CHUNK_SIZE = 200;
    const results = { imported: 0, errors: [] as string[] };

    // 1. Buscar o maior order atual UMA vez só
    const lastLead = await prisma.lead.findFirst({
      where: { statusId: input.statusId, trackingId: input.trackingId },
      orderBy: { order: "desc" },
      select: { order: true },
    });

    let currentOrder = lastLead
      ? new Decimal(lastLead.order).plus(1)
      : new Decimal(0);

    // 2. Buscar phones/emails já existentes UMA vez só
    const phones = input.leads.map((l) => l.phone).filter(Boolean) as string[];
    const existingLeads = await prisma.lead.findMany({
      where: {
        trackingId: input.trackingId,
        phone: { in: phones },
      },
      select: { phone: true, email: true },
    });

    const existingPhones = new Set(existingLeads.map((l) => l.phone));

    // 3. Filtrar leads válidos e montar payload
    const toInsert = [];
    for (const lead of input.leads) {
      if (lead.phone && existingPhones.has(lead.phone)) {
        results.errors.push(`Lead "${lead.name}" (${lead.phone}) já existe`);
        continue;
      }

      toInsert.push({
        name: lead.name,
        phone: lead.phone ?? null,
        email: lead.email ?? null,
        document: lead.document ?? null,
        description: lead.description ?? null,
        amount: lead.amount ? new Decimal(lead.amount) : new Decimal(0),
        temperature: lead.temperature ?? "COLD",
        source: lead.source ?? "DEFAULT",
        profile: lead.profile ?? null,
        statusId: input.statusId,
        trackingId: input.trackingId,
        responsibleId: context.user.id,
        order: currentOrder,
        currentAction: LeadAction.ACTIVE,
        isActive: true,
      });

      currentOrder = currentOrder.plus(1);
    }

    // 4. Inserir em chunks dentro de UMA transaction
    const chunks = chunkArray(toInsert, CHUNK_SIZE);

    await prisma.$transaction(
      async (tx) => {
        for (const chunk of chunks) {
          await tx.lead.createMany({
            data: chunk,
            skipDuplicates: true, // fallback de segurança
          });
        }
      },
      {
        timeout: 30_000, // aumentar timeout para imports grandes
      },
    );

    // 5. Registrar history em batch (separado, fora da transaction crítica)
    const insertedLeads = await prisma.lead.findMany({
      where: {
        trackingId: input.trackingId,
        phone: { in: toInsert.map((l) => l.phone).filter(Boolean) as string[] },
      },
      select: { id: true },
    });

    if (insertedLeads.length > 0) {
      await prisma.leadHistory.createMany({
        data: insertedLeads.map((lead) => ({
          leadId: lead.id,
          action: "ACTIVE" as LeadAction,
          notes: "Lead importado via planilha",
          userId: context.user.id,
        })),
      });
    }

    results.imported = insertedLeads.length;
    return results;
  });

// util
function chunkArray<T>(arr: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
    arr.slice(i * size, i * size + size),
  );
}
