"use client";

import { UserPlusIcon } from "lucide-react";
import { makeExecutionNode } from "../_shared/make-node";
import { WS_ADD_PARTICIPANT_CHANNEL_NAME } from "@/inngest/channels/workspace";
import { fetchWsAddParticipantToken } from "../../lib/realtime-tokens";

export const WsAddParticipantNode = makeExecutionNode<{ userId: string }>({
  name: "Adicionar participante",
  description: "Adicione um participante à ação",
  icon: UserPlusIcon,
  channelName: WS_ADD_PARTICIPANT_CHANNEL_NAME,
  refreshToken: fetchWsAddParticipantToken as any,
  dialogTitle: "Adicionar participante",
  fields: [{ kind: "member", name: "userId", label: "Participante" }],
  describe: (v) => (v?.userId ? "Participante definido" : undefined),
});
