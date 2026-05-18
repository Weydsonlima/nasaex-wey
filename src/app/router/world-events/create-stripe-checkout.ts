import { base } from "@/app/middlewares/base";
import { requiredAuthMiddleware } from "@/app/middlewares/auth";
import prisma from "@/lib/prisma";
import { stripeClient } from "@/lib/stripe";
import { z } from "zod";

/**
 * Cria uma Stripe Checkout session pra compra de ingresso de WorldEvent.
 *
 * O frontend chama esse endpoint quando o user clica "Comprar por R$ X",
 * recebe a URL retornada e faz `window.location.href = url`. Após pagamento,
 * o Stripe redireciona pra success_url e em paralelo dispara o webhook
 * `checkout.session.completed` que cria o `WorldEventTicket` (handler em
 * `/api/stripe/webhook/route.ts`, kind=world_event_ticket).
 *
 * Idempotência: se o user já tem ticket ACTIVE pra esse evento, retorna
 * `alreadyOwned: true` com o accessToken existente em vez de criar
 * uma nova session.
 *
 * Pré-requisitos:
 *  - `STRIPE_SECRET_KEY` no .env
 *  - Webhook do Stripe registrado em `/api/stripe/webhook` (já existe)
 *  - Evento com `ticketPriceBrl` definido
 */
export const createWorldEventStripeCheckout = base
  .use(requiredAuthMiddleware)
  .route({
    method: "POST",
    path: "/world-events/create-stripe-checkout",
    summary: "Cria Stripe Checkout session pra compra de ingresso",
  })
  .input(
    z.object({
      eventId: z.string(),
    }),
  )
  .output(
    z.object({
      url: z.string().nullable(),
      sessionId: z.string().nullable(),
      alreadyOwned: z.boolean(),
      accessToken: z.string().nullable(),
    }),
  )
  .handler(async ({ input, context, errors }) => {
    const event = await prisma.worldEvent.findUnique({
      where: { id: input.eventId },
      select: {
        id: true,
        slug: true,
        title: true,
        ticketPriceBrl: true,
        isFree: true,
        status: true,
        endsAt: true,
        station: { select: { orgId: true, userId: true } },
      },
    });
    if (!event) throw errors.NOT_FOUND({ message: "Evento não encontrado." });
    if (event.isFree) {
      throw errors.BAD_REQUEST({
        message: "Evento é gratuito — use o fluxo `purchaseTicket({ paymentMethod: 'free' })`.",
      });
    }
    if (!event.ticketPriceBrl) {
      throw errors.BAD_REQUEST({
        message: "Evento não aceita pagamento em R$.",
      });
    }
    if (event.status === "CANCELLED") {
      throw errors.BAD_REQUEST({ message: "Evento cancelado." });
    }
    if (event.endsAt.getTime() < Date.now()) {
      throw errors.BAD_REQUEST({ message: "Evento já terminou." });
    }

    // Idempotência: já tem ticket ACTIVE?
    const existing = await prisma.worldEventTicket.findFirst({
      where: {
        worldEventId: event.id,
        holderUserId: context.user.id,
        status: "ACTIVE",
      },
      select: { id: true, accessToken: true },
      orderBy: { createdAt: "desc" },
    });
    if (existing) {
      return {
        url: null,
        sessionId: null,
        alreadyOwned: true,
        accessToken: existing.accessToken,
      };
    }

    const origin =
      process.env.NEXT_PUBLIC_APP_URL ??
      process.env.APP_URL ??
      "http://localhost:3000";
    const successUrl = `${origin}/eventos/${event.slug}?stripe=success&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${origin}/eventos/${event.slug}?stripe=cancelled`;

    const priceBrl = Number(event.ticketPriceBrl);

    const session = await stripeClient.checkout.sessions.create({
      mode: "payment",
      customer_email: context.user.email ?? undefined,
      line_items: [
        {
          price_data: {
            currency: "brl",
            unit_amount: Math.round(priceBrl * 100),
            product_data: {
              name: `Ingresso: ${event.title}`,
              description: `Acesso ao WorldEvent "${event.title}" no NASA World.`,
            },
          },
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      // Metadata consumida pelo webhook em `/api/stripe/webhook/route.ts`
      // pra criar o `WorldEventTicket` (kind=world_event_ticket).
      metadata: {
        kind: "world_event_ticket",
        worldEventId: event.id,
        holderUserId: context.user.id,
        buyerUserId: context.user.id,
        buyerOrgId: context.session.activeOrganizationId ?? "",
      },
      payment_method_types: ["card"],
      locale: "pt-BR",
    });

    return {
      url: session.url,
      sessionId: session.id,
      alreadyOwned: false,
      accessToken: null,
    };
  });
