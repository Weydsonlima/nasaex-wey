import prisma from "@/lib/prisma";

export async function attendLeadIfWaiting(leadId: string, userId: string) {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: { id: true, statusFlow: true },
  });

  if (!lead || lead.statusFlow === "ACTIVE" || lead.statusFlow === "FINISHED") return;

  await prisma.lead.update({
    where: { id: lead.id },
    data: { statusFlow: "ACTIVE" },
  });
}
