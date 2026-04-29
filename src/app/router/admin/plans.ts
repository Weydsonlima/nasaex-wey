import { requireAdminMiddleware } from "@/app/middlewares/admin";
import { base } from "@/app/middlewares/base";
import prisma from "@/lib/prisma";
import { z } from "zod";

const adminBase = base.use(requireAdminMiddleware);

const planShape = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  slogan: z.string().nullable(),
  sortOrder: z.number(),
  monthlyStars: z.number(),
  priceMonthly: z.number(),
  billingType: z.string(),
  maxUsers: z.number(),
  rolloverPct: z.number(),
  benefits: z.array(z.string()),
  ctaLabel: z.string(),
  ctaLink: z.string().nullable(),
  ctaGatewayId: z.string().nullable(),
  highlighted: z.boolean(),
  isActive: z.boolean(),
  orgCount: z.number(),
});

// ── List ──────────────────────────────────────────────────────────────────────

export const listPlans = adminBase
  .route({ method: "GET", summary: "Admin — List all plans" })
  .output(z.object({ plans: z.array(planShape) }))
  .handler(async () => {
    const rows = await prisma.plan.findMany({
      orderBy: [{ sortOrder: "asc" }, { priceMonthly: "asc" }],
    });

    // Get org counts in a separate query to avoid Prisma _count select issues
    const orgCounts = await prisma.organization.groupBy({
      by: ["planId"],
      _count: { _all: true },
    });
    const countByPlan = new Map(
      orgCounts.map((c) => [c.planId ?? "", c._count._all]),
    );

    return {
      plans: rows.map((p) => ({
        id: p.id,
        slug: p.slug,
        name: p.name,
        slogan: p.slogan,
        sortOrder: p.sortOrder,
        monthlyStars: p.monthlyStars,
        priceMonthly: Number(p.priceMonthly),
        billingType: p.billingType,
        maxUsers: p.maxUsers,
        rolloverPct: p.rolloverPct,
        benefits: (p.benefits as string[]) ?? [],
        ctaLabel: p.ctaLabel,
        ctaLink: p.ctaLink,
        ctaGatewayId: p.ctaGatewayId,
        highlighted: p.highlighted,
        isActive: p.isActive,
        orgCount: countByPlan.get(p.id) ?? 0,
      })),
    };
  });

// ── Create ────────────────────────────────────────────────────────────────────

export const createPlan = adminBase
  .route({ method: "POST", summary: "Admin — Create plan" })
  .input(
    z.object({
      name: z.string().min(1),
      slogan: z.string().optional(),
      sortOrder: z.number().default(0),
      priceMonthly: z.number().min(0),
      billingType: z.enum(["monthly", "annual", "weekly"]).default("monthly"),
      monthlyStars: z.number().min(0),
      maxUsers: z.number().min(1),
      rolloverPct: z.number().min(0).max(100).default(30),
      benefits: z.array(z.string()).default([]),
      ctaLabel: z.string().default("Assinar agora"),
      ctaLink: z.string().optional(),
      ctaGatewayId: z.string().optional(),
      highlighted: z.boolean().default(false),
      isActive: z.boolean().default(true),
    }),
  )
  .output(z.object({ id: z.string() }))
  .handler(async ({ input }) => {
    const slug = input.name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .slice(0, 40);

    const unique = `${slug}-${Date.now().toString(36)}`;

    const plan = await prisma.plan.create({
      data: {
        slug: unique,
        name: input.name,
        slogan: input.slogan ?? null,
        sortOrder: input.sortOrder,
        priceMonthly: input.priceMonthly,
        billingType: input.billingType,
        monthlyStars: input.monthlyStars,
        maxUsers: input.maxUsers,
        rolloverPct: input.rolloverPct,
        benefits: input.benefits,
        ctaLabel: input.ctaLabel,
        ctaLink: input.ctaLink ?? null,
        ctaGatewayId: input.ctaGatewayId ?? null,
        highlighted: input.highlighted,
        isActive: input.isActive,
      },
    });

    // Stripe Product/Price provisioning is now handled per-environment via
    // STRIPE_PRICE_<SLUG_UPPER> env variables. See src/lib/auth.ts for the
    // mapping in the Stripe plugin.

    return { id: plan.id };
  });

// ── Update ────────────────────────────────────────────────────────────────────

export const updatePlan = adminBase
  .route({ method: "POST", summary: "Admin — Update plan" })
  .input(
    z.object({
      id: z.string(),
      name: z.string().min(1),
      slogan: z.string().optional(),
      sortOrder: z.number(),
      priceMonthly: z.number().min(0),
      billingType: z.enum(["monthly", "annual", "weekly"]),
      monthlyStars: z.number().min(0),
      maxUsers: z.number().min(1),
      rolloverPct: z.number().min(0).max(100),
      benefits: z.array(z.string()),
      ctaLabel: z.string(),
      ctaLink: z.string().optional(),
      ctaGatewayId: z.string().optional(),
      highlighted: z.boolean(),
      isActive: z.boolean(),
    }),
  )
  .output(z.object({ success: z.boolean() }))
  .handler(async ({ input }) => {
    await prisma.plan.update({
      where: { id: input.id },
      data: {
        name: input.name,
        slogan: input.slogan ?? null,
        sortOrder: input.sortOrder,
        priceMonthly: input.priceMonthly,
        billingType: input.billingType,
        monthlyStars: input.monthlyStars,
        maxUsers: input.maxUsers,
        rolloverPct: input.rolloverPct,
        benefits: input.benefits,
        ctaLabel: input.ctaLabel,
        ctaLink: input.ctaLink ?? null,
        ctaGatewayId: input.ctaGatewayId ?? null,
        highlighted: input.highlighted,
        isActive: input.isActive,
      },
    });

    return { success: true };
  });

// ── Delete ────────────────────────────────────────────────────────────────────

export const deletePlan = adminBase
  .route({ method: "DELETE", summary: "Admin — Delete plan" })
  .input(z.object({ id: z.string() }))
  .output(z.object({ success: z.boolean() }))
  .handler(async ({ input, errors }) => {
    const plan = await prisma.plan.findUnique({
      where: { id: input.id },
    });

    if (!plan) throw errors.NOT_FOUND({ message: "Plano não encontrado." });

    const orgCount = await prisma.organization.count({
      where: { planId: input.id },
    });

    if (orgCount > 0)
      throw errors.BAD_REQUEST({
        message: `Este plano está em uso por ${orgCount} empresa(s). Remova-as antes de excluir.`,
      });

    await prisma.plan.delete({ where: { id: input.id } });
    return { success: true };
  });

// ── Toggle active ─────────────────────────────────────────────────────────────

export const togglePlanActive = adminBase
  .route({ method: "POST", summary: "Admin — Toggle plan active" })
  .input(z.object({ id: z.string(), isActive: z.boolean() }))
  .output(z.object({ success: z.boolean() }))
  .handler(async ({ input }) => {
    await prisma.plan.update({
      where: { id: input.id },
      data: { isActive: input.isActive },
    });
    return { success: true };
  });
