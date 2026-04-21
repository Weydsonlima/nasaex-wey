"use client";

import { client } from "@/lib/orpc";
import { eventIteratorToStream } from "@orpc/client";
import { useChat } from "@ai-sdk/react";
import { v4 as uuidv4 } from "uuid";

export function useWorkspaceAi(workspaceId?: string, columnId?: string) {
  const {
    messages,
    status,
    error,
    sendMessage,
    setMessages,
    stop,
    clearError,
  } = useChat({
    id: "workspace-chat",
    transport: {
      async sendMessages(options) {
        return eventIteratorToStream(
          await client.ia.workspace.chat(
            {
              messages: options.messages,
              initialWorkspaceId: workspaceId,
              initialColumnId: columnId,
            },
            {
              signal: options.abortSignal,
            },
          ),
        );
      },
      reconnectToStream() {
        throw new Error("Unsupported");
      },
    },
  });

  const sendMessageWithData = (
    prompt: string,
    data: { workspaceId: string; columnId: string },
  ) => {
    if (!prompt.trim()) return;

    sendMessage(
      {
        id: uuidv4(),
        role: "user",
        parts: [{ text: prompt, type: "text" }],
      },
      {
        body: data, // passa workspaceId e columnId via body
      },
    );
  };

  const clearMessages = () => {
    setMessages([]);
  };

  return {
    messages,
    isLoading: status === "streaming" || status === "submitted",
    error,
    status,
    stop,
    clearError,
    sendMessage: sendMessageWithData,
    clearMessages,
  };
}
