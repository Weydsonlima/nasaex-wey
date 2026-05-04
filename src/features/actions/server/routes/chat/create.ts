import { base } from "@/app/middlewares/base";
import { requiredAuthMiddleware } from "@/app/middlewares/auth";
import { requireOrgMiddleware } from "@/app/middlewares/org";
import prisma from "@/lib/prisma";
import { pusherServer } from "@/lib/pusher";
import { createNotification } from "@/lib/notification-service";
import z from "zod";
import { assertActionAccess } from "./_helpers";

export const createActionChatMessage = base
  .use(requiredAuthMiddleware)
  .use(requireOrgMiddleware)
  .route({
    method: "POST",
    path: "/action/chat/create",
    summary: "Create text chat message",
  })
  .input(
    z.object({
      actionId: z.string(),
      body: z.string().min(1),
      quotedMessageId: z.string().optional(),
    }),
  )
  .handler(async ({ input, context, errors }) => {
    const { hasAccess, action, participantUserIds } = await assertActionAccess(
      input.actionId,
      context.user.id,
      context.org,
    );
    if (!hasAccess || !action)
      throw errors.FORBIDDEN({ message: "Sem acesso ao chat" });

    const message = await prisma.actionChatMessage.create({
      data: {
        actionId: input.actionId,
        body: input.body,
        quotedMessageId: input.quotedMessageId ?? null,
        senderId: context.user.id,
        senderName: context.user.name ?? null,
      },
      include: {
        sender: { select: { id: true, name: true, image: true } },
        quotedMessage: {
          select: {
            id: true,
            body: true,
            mediaUrl: true,
            mediaType: true,
            mimetype: true,
            fileName: true,
            senderId: true,
            senderName: true,
            isDeleted: true,
            createdAt: true,
          },
        },
      },
    });

    await prisma.actionChatRead.upsert({
      where: {
        actionId_userId: { actionId: input.actionId, userId: context.user.id },
      },
      update: { lastReadAt: new Date() },
      create: {
        actionId: input.actionId,
        userId: context.user.id,
        lastReadAt: new Date(),
      },
    });

    const pusherPayload = {
      id: message.id,
      actionId: message.actionId,
      body: message.body,
      mediaUrl: message.mediaUrl,
      mediaType: message.mediaType,
      mimetype: message.mimetype,
      fileName: message.fileName,
      quotedMessageId: message.quotedMessageId,
      senderId: message.senderId,
      senderName: message.senderName,
      isEdited: message.isEdited,
      isDeleted: message.isDeleted,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
      sender: message.sender
        ? { id: message.sender.id, name: message.sender.name, image: null }
        : null,
      quotedMessage: message.quotedMessage,
      currentUserId: context.user.id,
    };
    await pusherServer.trigger(
      `action-chat-${input.actionId}`,
      "message:created",
      pusherPayload,
    );

    const targetIds = participantUserIds.filter((id) => id !== context.user.id);
    if (targetIds.length > 0) {
      const truncated =
        input.body.length > 120 ? input.body.slice(0, 120) + "…" : input.body;
      const actionUrl = `/workspaces/${action.workspaceId}?actionId=${action.id}`;
      await Promise.allSettled(
        targetIds.map((userId) =>
          createNotification({
            userId,
            organizationId: action.organizationId ?? context.org.id,
            type: "CUSTOM",
            appKey: "explorer",
            title: `💬 ${context.user.name ?? "Alguém"} em "${action.title}"`,
            body: truncated,
            actionUrl,
            metadata: {
              kind: "action_chat_message",
              actionId: action.id,
              messageId: message.id,
              senderId: context.user.id,
            },
          }),
        ),
      );
    }

    return { message };
  });
