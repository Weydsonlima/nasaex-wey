import { requiredAuthMiddleware } from "@/app/middlewares/auth";
import { base } from "@/app/middlewares/base";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { streamText } from "ai";
import { google } from "@ai-sdk/google";
import { streamToEventIterator } from "@orpc/client";
import dayjs from "dayjs";

export const generateConversationSummary = base
  .use(requiredAuthMiddleware)
  .route({
    method: "GET",
    path: "/ai/conversation/summary",
    summary: "Generate conversation summary",
    tags: ["AI"],
  })
  .input(
    z.object({
      conversationId: z.string(),
      dateInit: z.string(),
      dateEnd: z.string(),
    }),
  )
  .handler(async ({ input, errors }) => {
    const { conversationId, dateInit, dateEnd } = input;

    console.log("dateInit", dateInit, "dateEnd", dateEnd);

    const conversation = await prisma.conversation.findUnique({
      where: {
        id: conversationId,
      },
      include: {
        messages: {
          take: 20,
          where: {
            createdAt: {
              gte: new Date(dateInit),
              lte: new Date(dateEnd),
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    console.log("conversation", conversation);

    if (!conversation) {
      throw errors.NOT_FOUND({
        message: "Conversation not found",
      });
    }

    const messages = conversation?.messages.map((message) => {
      return {
        body: message.body,
        fromMe: message.fromMe,
        senderName: message.fromMe
          ? message.senderName || "Sistema"
          : message.senderName || "Cliente",
        createdAt: message.createdAt,
      };
    });

    console.log("Message", messages);

    let lines: string[] = [];

    if (messages && messages.length > 0) {
      lines = messages.map((message) => {
        return `${message.senderName}: ${message.body}`;
      });
    }

    const compiled = lines.join("\n");

    const system = [
      `
        - Você é um assistente de suporte ao cliente.
        - Ajude o cliente dando um resumo das conversas.
        - Responde apenas em portugues.
        - Estilo: Neutro, especifíco e consistente. Não adicione uma frase de encerramento.
      `,
    ].join("\n");

    const result = streamText({
      model: google("gemini-2.5-flash"),
      system,
      messages: [
        {
          role: "user",
          content: compiled,
        },
      ],
      temperature: 0.2,
    });

    return streamToEventIterator(result.toUIMessageStream());
  });
