import { base } from "@/app/middlewares/base";
import { requiredAuthMiddleware } from "@/app/middlewares/auth";
import { requireOrgMiddleware } from "@/app/middlewares/org";
import prisma from "@/lib/prisma";
import { resend } from "@/lib/email/resend";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { sendText } from "@/http/uazapi/send-text";
import {
  PAYMENT_RESOURCES,
  PAYMENT_ACTIONS,
  ROLE_DEFAULTS,
  resolveEffectivePermissions,
} from "@/features/payment/lib/permissions";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

// PaymentAccess.passwordHash é NOT NULL por histórico (havia PIN próprio do
// módulo). O acesso hoje é a sessão da conta, então gravamos um hash opaco:
// nenhum valor conhecido bate com ele.
async function createOpaquePasswordHash(): Promise<string> {
  return bcrypt.hash(randomUUID(), 8);
}

async function fetchUserPhone(userId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { phone: true },
  });
  return user?.phone ?? null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Schemas
// ─────────────────────────────────────────────────────────────────────────────

const permissionResource = z.enum(PAYMENT_RESOURCES);
const permissionAction = z.enum(PAYMENT_ACTIONS);

const permissionsOverrideSchema = z
  .record(permissionResource, z.record(permissionAction, z.boolean()))
  .nullable();

const accessShape = z.object({
  id: z.string(),
  userId: z.string(),
  organizationId: z.string(),
  isAuthorized: z.boolean(),
  phone: z.string().nullable(),
  role: z.enum(["VIEWER", "EDITOR", "ADMIN", "OWNER"]),
  permissions: z.unknown().nullable(),
  authorizedById: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  user: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    phone: z.string().nullable().optional(),
  }),
});

// ─────────────────────────────────────────────────────────────────────────────
// getMyPaymentAccess — usuário lê a própria autorização/role/permissions
// ─────────────────────────────────────────────────────────────────────────────

export const getMyPaymentAccess = base
  .use(requiredAuthMiddleware)
  .use(requireOrgMiddleware)
  .route({ method: "GET", summary: "Get my payment access", tags: ["Payment"] })
  .input(z.object({}))
  .output(
    z.object({
      authorized: z.boolean(),
      role: z.enum(["VIEWER", "EDITOR", "ADMIN", "OWNER"]).nullable(),
      effective: z.unknown().nullable(),
      hasPhone: z.boolean(),
      // Sinaliza pro frontend "estamos em bootstrap" — a org ainda não tem
      // NINGUÉM autorizado. Combinado com master-da-org, libera a UI de
      // reivindicação inicial (a primeira grantPaymentAccess vira OWNER).
      orgHasAnyAccess: z.boolean(),
      // True quando o caller ainda não tem acesso autorizado MAS é owner da
      // empresa (Member.role === "owner"). O gate usa isso pra mostrar o
      // botão de auto-provisionamento (vira OWNER do módulo), em vez da
      // tela de bloqueio. Independe de orgHasAnyAccess: o owner nunca
      // deve ficar trancado pra fora do próprio financeiro.
      canSelfSetup: z.boolean(),
    }),
  )
  .handler(async ({ context, errors }) => {
    try {
      const access = await prisma.paymentAccess.findUnique({
        where: {
          userId_organizationId: {
            userId: context.user.id,
            organizationId: context.org.id,
          },
        },
      });
      const anyAccess = await prisma.paymentAccess.findFirst({
        where: { organizationId: context.org.id, isAuthorized: true },
        select: { id: true },
      });
      const orgHasAnyAccess = !!anyAccess;

      if (!access || !access.isAuthorized) {
        return {
          authorized: false,
          role: null,
          effective: null,
          hasPhone: false,
          orgHasAnyAccess,
          canSelfSetup: await isOrgOwner(context.user.id, context.org.id),
        };
      }
      const phone = access.phone ?? (await fetchUserPhone(access.userId));
      return {
        authorized: true,
        role: access.role,
        effective: resolveEffectivePermissions(access.role, access.permissions),
        hasPhone: !!phone,
        orgHasAnyAccess,
        canSelfSetup: false,
      };
    } catch (err) {
      console.error("[payment/access/getMy]", err);
      throw errors.INTERNAL_SERVER_ERROR;
    }
  });

// ─────────────────────────────────────────────────────────────────────────────
// list / grant / revoke / updateRole / updatePermissions
// ─────────────────────────────────────────────────────────────────────────────

async function requireOwnerAccess(userId: string, orgId: string) {
  const my = await prisma.paymentAccess.findUnique({
    where: { userId_organizationId: { userId, organizationId: orgId } },
  });
  return my?.isAuthorized && my.role === "OWNER";
}

async function requireOwnerOrAdminAccess(userId: string, orgId: string) {
  const my = await prisma.paymentAccess.findUnique({
    where: { userId_organizationId: { userId, organizationId: orgId } },
  });
  return my?.isAuthorized && (my.role === "OWNER" || my.role === "ADMIN");
}

/** Owner (criador) da organização no better-auth — Member.role === "owner". */
async function isOrgOwner(userId: string, orgId: string) {
  const member = await prisma.member.findFirst({
    where: { organizationId: orgId, userId },
    select: { role: true },
  });
  return member?.role === "owner";
}

/**
 * Retorna true se o caller pode listar/reivindicar acesso no cenário de
 * bootstrap — quando a org ainda NÃO tem nenhum PaymentAccess autorizado E
 * o caller é master (owner) da organização. Depois que existir OWNER de
 * verdade, essa porta fecha automaticamente.
 */
async function isMasterInBootstrap(userId: string, orgId: string) {
  const anyAccess = await prisma.paymentAccess.findFirst({
    where: { organizationId: orgId, isAuthorized: true },
    select: { id: true },
  });
  if (anyAccess) return false;
  return isOrgOwner(userId, orgId);
}

export const listPaymentAccess = base
  .use(requiredAuthMiddleware)
  .use(requireOrgMiddleware)
  .route({
    method: "GET",
    summary: "List payment access records",
    tags: ["Payment"],
  })
  .input(z.object({}))
  .output(z.object({ records: z.array(accessShape) }))
  .handler(async ({ context, errors }) => {
    try {
      const allowed =
        (await requireOwnerOrAdminAccess(context.user.id, context.org.id)) ||
        (await isMasterInBootstrap(context.user.id, context.org.id));
      if (!allowed) throw errors.FORBIDDEN;

      const records = await prisma.paymentAccess.findMany({
        where: { organizationId: context.org.id },
        include: {
          user: { select: { id: true, name: true, email: true, phone: true } },
        },
        orderBy: { createdAt: "desc" },
      });
      return {
        records: records.map((record) => ({
          id: record.id,
          userId: record.userId,
          organizationId: record.organizationId,
          isAuthorized: record.isAuthorized,
          phone: record.phone,
          role: record.role,
          permissions: record.permissions,
          authorizedById: record.authorizedById,
          createdAt: record.createdAt,
          updatedAt: record.updatedAt,
          user: record.user,
        })),
      };
    } catch (err) {
      if ((err as { code?: string }).code === "FORBIDDEN") throw err;
      console.error("[payment/access/list]", err);
      throw errors.INTERNAL_SERVER_ERROR;
    }
  });

export const grantPaymentAccess = base
  .use(requiredAuthMiddleware)
  .use(requireOrgMiddleware)
  .route({
    method: "POST",
    summary: "Grant payment access",
    tags: ["Payment"],
  })
  .input(
    z.object({
      userId: z.string(),
      phone: z.string().optional(),
      role: z.enum(["VIEWER", "EDITOR", "ADMIN", "OWNER"]).default("VIEWER"),
      sendVia: z.enum(["email", "whatsapp"]).default("whatsapp"),
    }),
  )
  .output(
    z.object({
      ok: z.boolean(),
      // Preenchido quando o aviso de liberação não saiu por nenhum canal. Não
      // impede o acesso — a autorização já está gravada.
      deliveryWarning: z.string().optional(),
    }),
  )
  .handler(async ({ input, context, errors }) => {
    try {
      const isOwner = await requireOwnerAccess(context.user.id, context.org.id);
      if (!isOwner) {
        // primeiro acesso: se ainda não existe NENHUM PaymentAccess pra org,
        // o caller vira o primeiro OWNER (bootstrap pra não trancar a org)
        const anyAccess = await prisma.paymentAccess.findFirst({
          where: { organizationId: context.org.id, isAuthorized: true },
        });
        if (anyAccess) throw errors.FORBIDDEN;
      }

      // Aceita ID OU email — se não bate por ID, tenta por email
      let targetUser = await prisma.user.findUnique({
        where: { id: input.userId },
        select: { id: true, name: true, email: true, phone: true },
      });
      if (!targetUser && input.userId.includes("@")) {
        targetUser = await prisma.user.findUnique({
          where: { email: input.userId.toLowerCase() },
          select: { id: true, name: true, email: true, phone: true },
        });
      }
      if (!targetUser) {
        throw errors.NOT_FOUND({
          message: "Usuário não encontrado por ID nem por e-mail",
        });
      }

      const phone = input.phone ?? targetUser.phone ?? null;

      await prisma.paymentAccess.upsert({
        where: {
          userId_organizationId: {
            userId: targetUser.id,
            organizationId: context.org.id,
          },
        },
        create: {
          userId: targetUser.id,
          organizationId: context.org.id,
          passwordHash: await createOpaquePasswordHash(),
          isAuthorized: true,
          phone,
          role: input.role,
          authorizedById: context.user.id,
        },
        update: {
          isAuthorized: true,
          phone: phone ?? undefined,
          role: input.role,
          authorizedById: context.user.id,
        },
      });

      const message =
        `🔐 *NASA Payment* — Acesso liberado\n\n` +
        `Olá, ${targetUser.name}.\n` +
        `Seu acesso ao módulo financeiro foi liberado.\n` +
        `Entre em /payment com a sua própria conta — não existe senha ` +
        `separada pro financeiro.\n` +
        `Role: ${input.role}.`;

      // O aviso é informativo: a autorização já está no banco, então falha de
      // canal não corrompe estado nem bloqueia o usuário.
      let deliveryWarning: string | undefined;

      async function notifyByWhatsapp() {
        const token = process.env.UAZAPI_TOKEN;
        if (!token) throw new Error("UAZAPI_TOKEN não configurado");
        if (!phone) throw new Error("Sem telefone (Geral > Telefone)");
        await sendText(
          token,
          { number: phone, text: message },
          process.env.NEXT_PUBLIC_UAZAPI_BASE_URL,
        );
      }

      async function notifyByEmail() {
        await resend.emails.send({
          from: process.env.BETTER_AUTH_EMAIL ?? "noreply@nasaex.com",
          to: targetUser!.email,
          subject: "🔐 NASA Payment — Acesso liberado",
          html: `<div style="font-family:sans-serif;max-width:480px;margin:auto">
            <h2>NASA Payment — Acesso liberado</h2>
            <p>Olá, <strong>${targetUser!.name}</strong>.</p>
            <p>Seu acesso ao módulo financeiro foi liberado com a role <strong>${input.role}</strong>.</p>
            <p>Entre em <strong>/payment</strong> usando a sua própria conta — não existe senha separada pro financeiro.</p>
          </div>`,
        });
      }

      if (input.sendVia === "whatsapp") {
        try {
          await notifyByWhatsapp();
        } catch (err) {
          const reason = (err as Error).message;
          try {
            await notifyByEmail();
            deliveryWarning = `WhatsApp falhou (${reason}); avisamos por e-mail.`;
          } catch (emailErr) {
            deliveryWarning = `Acesso liberado, mas o aviso não saiu (WhatsApp: ${reason}; e-mail: ${(emailErr as Error).message}).`;
          }
        }
      } else {
        try {
          await notifyByEmail();
        } catch (err) {
          deliveryWarning = `Acesso liberado, mas o e-mail de aviso falhou (${(err as Error).message}).`;
        }
      }

      return { ok: true, deliveryWarning };
    } catch (err) {
      if (
        (err as { code?: string }).code === "FORBIDDEN" ||
        (err as { code?: string }).code === "NOT_FOUND"
      )
        throw err;
      console.error("[payment/access/grant]", err);
      throw errors.INTERNAL_SERVER_ERROR({
        message: (err as Error).message ?? "Falha ao liberar acesso",
      });
    }
  });

// Auto-provisionamento do owner da empresa. Diferente de grantPaymentAccess
// (um OWNER libera outra pessoa), aqui o próprio owner da org vira OWNER do
// módulo — sem depender de ninguém autorizá-lo. É o caminho que destrava o
// "primeiro usuário não consegue acessar o financeiro".
export const setupOwnerPaymentAccess = base
  .use(requiredAuthMiddleware)
  .use(requireOrgMiddleware)
  .route({
    method: "POST",
    summary: "Owner self-provisions payment access",
    tags: ["Payment"],
  })
  .input(z.object({ phone: z.string().optional() }))
  .output(z.object({ ok: z.boolean() }))
  .handler(async ({ input, context, errors }) => {
    try {
      const isOwner = await isOrgOwner(context.user.id, context.org.id);
      if (!isOwner) throw errors.FORBIDDEN;

      const existing = await prisma.paymentAccess.findUnique({
        where: {
          userId_organizationId: {
            userId: context.user.id,
            organizationId: context.org.id,
          },
        },
      });
      // Já autorizado: este fluxo é só pra criar o acesso inicial.
      if (existing?.isAuthorized) throw errors.FORBIDDEN;

      const user = await prisma.user.findUnique({
        where: { id: context.user.id },
        select: { phone: true },
      });
      const phone = input.phone ?? user?.phone ?? null;

      await prisma.paymentAccess.upsert({
        where: {
          userId_organizationId: {
            userId: context.user.id,
            organizationId: context.org.id,
          },
        },
        create: {
          userId: context.user.id,
          organizationId: context.org.id,
          passwordHash: await createOpaquePasswordHash(),
          isAuthorized: true,
          phone,
          role: "OWNER",
          authorizedById: context.user.id,
        },
        update: {
          isAuthorized: true,
          phone: phone ?? undefined,
          role: "OWNER",
          authorizedById: context.user.id,
        },
      });

      return { ok: true };
    } catch (err) {
      if ((err as { code?: string }).code === "FORBIDDEN") throw err;
      console.error("[payment/access/setupOwner]", err);
      throw errors.INTERNAL_SERVER_ERROR({
        message: (err as Error).message ?? "Falha ao configurar acesso",
      });
    }
  });

export const revokePaymentAccess = base
  .use(requiredAuthMiddleware)
  .use(requireOrgMiddleware)
  .route({
    method: "DELETE",
    summary: "Revoke payment access",
    tags: ["Payment"],
  })
  .input(z.object({ userId: z.string() }))
  .output(z.object({ ok: z.boolean() }))
  .handler(async ({ input, context, errors }) => {
    try {
      const isOwner = await requireOwnerAccess(context.user.id, context.org.id);
      if (!isOwner) throw errors.FORBIDDEN;
      await prisma.paymentAccess.updateMany({
        where: { userId: input.userId, organizationId: context.org.id },
        data: { isAuthorized: false },
      });
      return { ok: true };
    } catch (err) {
      if ((err as { code?: string }).code === "FORBIDDEN") throw err;
      console.error("[payment/access/revoke]", err);
      throw errors.INTERNAL_SERVER_ERROR;
    }
  });

export const updatePaymentRole = base
  .use(requiredAuthMiddleware)
  .use(requireOrgMiddleware)
  .route({ method: "POST", summary: "Update payment role", tags: ["Payment"] })
  .input(
    z.object({
      userId: z.string(),
      role: z.enum(["VIEWER", "EDITOR", "ADMIN", "OWNER"]),
    }),
  )
  .output(z.object({ ok: z.boolean() }))
  .handler(async ({ input, context, errors }) => {
    try {
      const isOwner = await requireOwnerAccess(context.user.id, context.org.id);
      if (!isOwner) throw errors.FORBIDDEN;
      await prisma.paymentAccess.updateMany({
        where: { userId: input.userId, organizationId: context.org.id },
        data: { role: input.role },
      });
      return { ok: true };
    } catch (err) {
      if ((err as { code?: string }).code === "FORBIDDEN") throw err;
      console.error("[payment/access/updateRole]", err);
      throw errors.INTERNAL_SERVER_ERROR;
    }
  });

export const updatePaymentPermissions = base
  .use(requiredAuthMiddleware)
  .use(requireOrgMiddleware)
  .route({
    method: "POST",
    summary: "Update payment permissions override",
    tags: ["Payment"],
  })
  .input(
    z.object({
      userId: z.string(),
      permissions: permissionsOverrideSchema,
    }),
  )
  .output(z.object({ ok: z.boolean() }))
  .handler(async ({ input, context, errors }) => {
    try {
      const isOwner = await requireOwnerAccess(context.user.id, context.org.id);
      if (!isOwner) throw errors.FORBIDDEN;
      await prisma.paymentAccess.updateMany({
        where: { userId: input.userId, organizationId: context.org.id },
        data: { permissions: input.permissions ?? undefined },
      });
      return { ok: true };
    } catch (err) {
      if ((err as { code?: string }).code === "FORBIDDEN") throw err;
      console.error("[payment/access/updatePermissions]", err);
      throw errors.INTERNAL_SERVER_ERROR;
    }
  });

// Re-exports usados pelo router que ainda importa o nome antigo
export { ROLE_DEFAULTS };
