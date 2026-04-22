"use client";

import { TimerIcon } from "lucide-react";
import { makeExecutionNode } from "../_shared/make-node";
import { WS_WAIT_CHANNEL_NAME } from "@/inngest/channels/workspace";
import { fetchWsWaitToken } from "../../lib/realtime-tokens";

type Values = {
  type: "MINUTES" | "HOURS";
  minutes: number;
  hours: number;
};

export const WsWaitNode = makeExecutionNode<Values>({
  name: "Esperar",
  description: "Aguarda antes de continuar",
  icon: TimerIcon,
  channelName: WS_WAIT_CHANNEL_NAME,
  refreshToken: fetchWsWaitToken as any,
  dialogTitle: "Esperar",
  fields: [
    {
      kind: "select",
      name: "type",
      label: "Unidade",
      options: [
        { value: "MINUTES", label: "Minutos" },
        { value: "HOURS", label: "Horas" },
      ],
    },
    { kind: "number", name: "minutes", label: "Minutos (se for minutos)" },
    { kind: "number", name: "hours", label: "Horas (se for horas)" },
  ],
  describe: (v) =>
    v?.type === "MINUTES"
      ? `${v.minutes} min`
      : v?.type === "HOURS"
        ? `${v.hours}h`
        : undefined,
});
