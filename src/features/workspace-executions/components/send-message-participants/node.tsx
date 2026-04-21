"use client";

import { SendIcon } from "lucide-react";
import { makeExecutionNode } from "../_shared/make-node";
import { WS_SEND_MESSAGE_CHANNEL_NAME } from "@/inngest/channels/workspace";
import { fetchWsSendMessageToken } from "../../lib/realtime-tokens";

export const WsSendMessageParticipantsNode = makeExecutionNode<{
  message: string;
}>({
  name: "Mensagem p/ participantes",
  description: "Envia WhatsApp aos participantes",
  icon: SendIcon,
  channelName: WS_SEND_MESSAGE_CHANNEL_NAME,
  refreshToken: fetchWsSendMessageToken as any,
  dialogTitle: "Enviar mensagem aos participantes",
  dialogDescription:
    "Use variáveis como {{action.title}}, {{workspace.name}}, {{participant.name}}.",
  fields: [{ kind: "textarea", name: "message", label: "Mensagem" }],
});
