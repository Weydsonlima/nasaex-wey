import { base } from "@/app/middlewares/base";
import { requiredAuthMiddleware } from "@/app/middlewares/auth";
import { requireOrgMiddleware } from "@/app/middlewares/org";
import prisma from "@/lib/prisma";
import { StarTransactionType } from "@/generated/prisma/enums";

/** Histórico de vendas (créditos COURSE_PAYOUT) da org criadora. */
export const creatorListSales = base
  .use(requiredAuthMiddleware)
  .use(requireOrgMiddleware)
  .handler(async ({ context }) => {
    const orgId = context.org.id;

    const transactions = await prisma.starTransaction.findMany({
      where: { organizationId: orgId, type: StarTransactionType.COURSE_PAYOUT },
      orderBy: { createdAt: "desc" },
      take: 200,
      select: {
        id: true,
        amount: true,
        balanceAfter: true,
        description: true,
        createdAt: true,
      },
    });

    const totalEarned = transactions.reduce((acc, t) => acc + t.amount, 0);

    return { transactions, totalEarned };
  });
