"use client";

import { MailIcon } from "lucide-react";
import { makeExecutionNode } from "../_shared/make-node";
import { WS_SEND_EMAIL_CHANNEL_NAME } from "@/inngest/channels/workspace";
import { fetchWsSendEmailToken } from "../../lib/realtime-tokens";

export const WsSendEmailParticipantsNode = makeExecutionNode<{
  subject: string;
  body: string;
}>({
  name: "Email p/ participantes",
  description: "Envia notificação (email) aos participantes",
  icon: MailIcon,
  channelName: WS_SEND_EMAIL_CHANNEL_NAME,
  refreshToken: fetchWsSendEmailToken as any,
  dialogTitle: "Enviar email aos participantes",
  dialogDescription:
    "Use variáveis como {{action.title}}, {{workspace.name}}, {{participant.name}}.",
  fields: [
    { kind: "text", name: "subject", label: "Assunto" },
    { kind: "textarea", name: "body", label: "Corpo" },
  ],
});
