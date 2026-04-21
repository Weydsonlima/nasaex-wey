"use client";

import { ListChecksIcon } from "lucide-react";
import { makeExecutionNode } from "../_shared/make-node";
import { WS_CREATE_SUB_ACTION_CHANNEL_NAME } from "@/inngest/channels/workspace";
import { fetchWsCreateSubActionToken } from "../../lib/realtime-tokens";

export const WsCreateSubActionNode = makeExecutionNode<{
  title: string;
  description?: string;
}>({
  name: "Criar sub-ação",
  description: "Crie uma sub-ação",
  icon: ListChecksIcon,
  channelName: WS_CREATE_SUB_ACTION_CHANNEL_NAME,
  refreshToken: fetchWsCreateSubActionToken as any,
  dialogTitle: "Criar sub-ação",
  fields: [
    { kind: "text", name: "title", label: "Título" },
    { kind: "textarea", name: "description", label: "Descrição" },
  ],
  describe: (v) => v?.title,
});
