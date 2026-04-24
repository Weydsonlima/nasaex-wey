"use client";

import { client } from "@/lib/orpc";
import { eventIteratorToStream } from "@orpc/client";
import { useChat } from "@ai-sdk/react";
import { v4 as uuidv4 } from "uuid";

export function useTrackingAi(trackingId: string) {
  const { messages, status, error, sendMessage, setMessages, stop, clearError } =
    useChat({
      id: `tracking-chat-${trackingId}`,
      transport: {
        async sendMessages(options) {
          return eventIteratorToStream(
            await client.ia.tracking.chat(
              { messages: options.messages, trackingId },
              { signal: options.abortSignal },
            ),
          );
        },
        reconnectToStream() {
          throw new Error("Unsupported");
        },
      },
    });

  const sendMessageWithData = (prompt: string) => {
    if (!prompt.trim()) return;
    sendMessage({
      id: uuidv4(),
      role: "user",
      parts: [{ text: prompt, type: "text" }],
    });
  };

  return {
    messages,
    isLoading: status === "streaming" || status === "submitted",
    status,
    error,
    stop,
    clearError,
    sendMessage: sendMessageWithData,
    clearMessages: () => setMessages([]),
  };
}
