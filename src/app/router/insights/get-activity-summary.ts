import { base } from "@/app/middlewares/base";
import { requiredAuthMiddleware } from "@/app/middlewares/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

export const getActivitySummary = base
  .use(requiredAuthMiddleware)
  .input(
    z.object({
      from: z.string().datetime().optional(),
      to: z.string().datetime().optional(),
      orgIds: z.array(z.string()).optional(),
      userIds: z.array(z.string()).optional(),
      appSlugs: z.array(z.string()).optional(),
    }),
  )
  .handler(async ({ input, context }) => {
    const memberships = await prisma.member.findMany({
      where: { userId: context.user.id },
      select: { organizationId: true, role: true },
    });
    const myOrgIds = memberships.map((m) => m.organizationId);
    const requestedOrgs = (input.orgIds && input.orgIds.length > 0)
      ? input.orgIds.filter((id) => myOrgIds.includes(id))
      : myOrgIds;

    if (requestedOrgs.length === 0) {
      return {
        totalActiveSec: 0,
        totalOnlineSec: 0,
        spacePointsEarned: 0,
        starsConsumed: 0,
        byUser: [],
        byApp: [],
      };
    }

    const isMemberOnly = memberships.every((m) => m.role === "member");
    const userFilter = isMemberOnly ? [context.user.id] : input.userIds;

    const from = input.from ? new Date(input.from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const to = input.to ? new Date(input.to) : new Date();

    const where: any = {
      organizationId: { in: requestedOrgs },
      createdAt: { gte: from, lte: to },
    };
    if (userFilter && userFilter.length > 0) where.userId = { in: userFilter };
    if (input.appSlugs && input.appSlugs.length > 0) where.appSlug = { in: input.appSlugs };

    const [logs, presence, stars, spTransactions] = await Promise.all([
      prisma.systemActivityLog.findMany({
        where,
        select: {
          userId: true,
          userName: true,
          userImage: true,
          appSlug: true,
          createdAt: true,
          durationMs: true,
        },
      }),
      prisma.userPresence.findMany({
        where: { organizationId: { in: requestedOrgs } },
        select: {
          userId: true,
          lastSeenAt: true,
          activeAppSlug: true,
          activePath: true,
          activeResource: true,
        },
      }),
      prisma.starTransaction.findMany({
        where: {
          organizationId: { in: requestedOrgs },
          amount: { lt: 0 },
          createdAt: { gte: from, lte: to },
        },
        select: { amount: true, appSlug: true },
      }),
      prisma.spacePointTransaction.findMany({
        where: {
          orgId: { in: requestedOrgs },
          createdAt: { gte: from, lte: to },
        },
        select: { points: true, userPoint: { select: { userId: true } } },
      }),
    ]);

    const fiveMinAgo = Date.now() - 5 * 60 * 1000;

    const byUser: Record<string, {
      userId: string;
      name: string;
      image: string | null;
      actions: number;
      activeMs: number;
      isOnlineNow: boolean;
      currentActivity: { appSlug: string | null; path: string | null; resource: string | null } | null;
      spacePoints: number;
      byApp: Record<string, { actions: number; activeMs: number }>;
    }> = {};

    for (const log of logs) {
      if (!byUser[log.userId]) {
        byUser[log.userId] = {
          userId: log.userId,
          name: log.userName,
          image: log.userImage ?? null,
          actions: 0,
          activeMs: 0,
          isOnlineNow: false,
          currentActivity: null,
          spacePoints: 0,
          byApp: {},
        };
      }
      const u = byUser[log.userId];
      u.actions++;
      const dur = log.durationMs ?? 0;
      u.activeMs += dur;
      if (!u.byApp[log.appSlug]) u.byApp[log.appSlug] = { actions: 0, activeMs: 0 };
      u.byApp[log.appSlug].actions++;
      u.byApp[log.appSlug].activeMs += dur;
    }

    for (const p of presence) {
      const last = p.lastSeenAt.getTime();
      const isOnline = last >= fiveMinAgo;
      if (byUser[p.userId]) {
        byUser[p.userId].isOnlineNow = byUser[p.userId].isOnlineNow || isOnline;
        if (isOnline) {
          byUser[p.userId].currentActivity = {
            appSlug: p.activeAppSlug,
            path: p.activePath,
            resource: p.activeResource,
          };
        }
      }
    }

    for (const sp of spTransactions) {
      const userId = sp.userPoint?.userId;
      if (userId && byUser[userId]) byUser[userId].spacePoints += sp.points;
    }

    const byAppMap: Record<string, { actions: number; activeMs: number; users: Set<string> }> = {};
    for (const log of logs) {
      if (!byAppMap[log.appSlug]) byAppMap[log.appSlug] = { actions: 0, activeMs: 0, users: new Set() };
      byAppMap[log.appSlug].actions++;
      byAppMap[log.appSlug].activeMs += log.durationMs ?? 0;
      byAppMap[log.appSlug].users.add(log.userId);
    }

    return {
      totalActiveSec: Math.round(logs.reduce((s, l) => s + (l.durationMs ?? 0), 0) / 1000),
      totalOnlineSec: 0,
      spacePointsEarned: spTransactions.reduce((s, t) => s + t.points, 0),
      starsConsumed: stars.reduce((s, t) => s + Math.abs(t.amount), 0),
      byUser: Object.values(byUser).sort((a, b) => b.actions - a.actions),
      byApp: Object.entries(byAppMap)
        .map(([slug, v]) => ({
          appSlug: slug,
          actions: v.actions,
          activeMs: v.activeMs,
          uniqueUsers: v.users.size,
        }))
        .sort((a, b) => b.actions - a.actions),
    };
  });
