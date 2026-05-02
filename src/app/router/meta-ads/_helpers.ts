import prisma from "@/lib/prisma";

export async function getMetaAuth(orgId: string) {
  const integration = await prisma.platformIntegration.findUnique({
    where: { organizationId_platform: { organizationId: orgId, platform: "META" } },
  });
  if (!integration || !integration.isActive) return null;
  const config = (integration.config ?? {}) as Record<string, string>;
  if (!config.accessToken || !config.adAccountId) return null;
  return { accessToken: config.accessToken, adAccountId: config.adAccountId };
}
