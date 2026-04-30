import { requiredAuthMiddleware } from "@/app/middlewares/auth";
import { base } from "@/app/middlewares/base";
import { MessageStatus } from "@/features/tracking-chat/types";
import { sendText } from "@/http/uazapi/send-text";
import prisma from "@/lib/prisma";
import { MessageChannel } from "@/generated/prisma/enums";
import z from "zod";

export const forwardMessageHandler = base
  .use(requiredAuthMiddleware)
  .route({
    method: "POST",
    path: "/message/forward",
    summary: "Forward message to conversations",
  })
  .input(
    z.object({
      body: z.string(),
      conversationIds: z.array(z.string()).min(1),
      token: z.string(),
    }),
  )
  .handler(async ({ input, context }) => {
    const results = await Promise.allSettled(
      input.conversationIds.map(async (conversationId) => {
        const conversation = await prisma.conversation.findUnique({
          where: { id: conversationId },
          select: {
            remoteJid: true,
            channel: true,
            lead: { select: { phone: true } },
          },
        });

        if (!conversation) {
          throw new Error(`Conversation ${conversationId} not found`);
        }

        const channel = conversation.channel ?? MessageChannel.WHATSAPP;

        if (channel !== MessageChannel.WHATSAPP) {
          throw new Error(`Channel ${channel} not supported for forwarding`);
        }

        const number =
          conversation.lead.phone ?? conversation.remoteJid.replace("@s.whatsapp.net", "");

        const response = await sendText(input.token, {
          text: input.body,
          number,
        });

        const message = await prisma.message.create({
          data: {
            conversationId,
            body: input.body,
            messageId: response.messageid,
            fromMe: true,
            status: MessageStatus.SENT,
            senderName: context.user.name,
          },
          select: {
            id: true,
            messageId: true,
            body: true,
            createdAt: true,
          },
        });

        return {
          conversationId,
          messageId: message.messageId,
          body: message.body,
          createdAt: message.createdAt,
          success: true,
        };
      }),
    );

    return {
      results: results.map((r, i) =>
        r.status === "fulfilled"
          ? r.value
          : { conversationId: input.conversationIds[i], success: false, error: String((r as PromiseRejectedResult).reason) },
      ),
    };
  });
