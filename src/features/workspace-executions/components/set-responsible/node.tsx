"use client";

import { UserRoundPlusIcon } from "lucide-react";
import { makeExecutionNode } from "../_shared/make-node";
import { WS_SET_RESPONSIBLE_CHANNEL_NAME } from "@/inngest/channels/workspace";
import { fetchWsSetResponsibleToken } from "../../lib/realtime-tokens";

export const WsSetResponsibleNode = makeExecutionNode<{ userId: string }>({
  name: "Definir responsável",
  description: "Defina um responsável para a ação",
  icon: UserRoundPlusIcon,
  channelName: WS_SET_RESPONSIBLE_CHANNEL_NAME,
  refreshToken: fetchWsSetResponsibleToken as any,
  dialogTitle: "Definir responsável",
  fields: [{ kind: "member", name: "userId", label: "Responsável" }],
  describe: (v) => (v?.userId ? "Responsável definido" : undefined),
});
