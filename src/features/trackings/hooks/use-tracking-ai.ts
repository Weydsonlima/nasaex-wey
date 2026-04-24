"use client";

import { client } from "@/lib/orpc";
import { eventIteratorToStream } from "@orpc/client";
import { useChat, type UIMessage } from "@ai-sdk/react";
import { v4 as uuidv4 } from "uuid";
import { useKanbanStore } from "../lib/kanban-store";
import type { Lead } from "../types";

// Type helpers

type ToolUIPart = Extract<
  UIMessage["parts"][number],
  { type: `tool-${string}` }
>;

function isToolPart(part: UIMessage["parts"][number]): part is ToolUIPart {
  return typeof part.type === "string" && part.type.startsWith("tool-");
}

type ToolOutputPart = Extract<ToolUIPart, { state: "output-available" }>;

type CreateLeadOutput = {
  success: boolean;
  leadId?: string;
  leadName?: string;
  statusId?: string;
  createdAt?: string;
};

type UpdateLeadOutput = {
  success: boolean;
  leadId?: string;
  statusId?: string;
};

type MoveLeadOutput = {
  success: boolean;
  leadId?: string;
  newStatusId?: string;
};

// Optimistic Kanban update helpers

function buildOptimisticLead(out: CreateLeadOutput): Lead {
  return {
    id: out.leadId!,
    name: out.leadName ?? "Novo lead",
    statusId: out.statusId!,
    trackingId: "", // not available from tool output; store doesn't filter by it
    isActive: true,
    currentAction: "ACTIVE",
    email: null,
    phone: null,
    profile: null,
    description: null,
    responsible: null,
    leadTags: [],
    temperature: "COLD",
    order: "0",
    createdAt: out.createdAt ? new Date(out.createdAt) : new Date(),
  };
}

function applyCreateLead(out: CreateLeadOutput) {
  if (!out.leadId || !out.statusId) return;

  const store = useKanbanStore.getState();
  const existing = store.columns[out.statusId];

  // Prepend the new lead at position 0 of the target column
  const currentLeads = existing?.leads ?? [];
  if (currentLeads.some((l) => l.id === out.leadId)) return; // already there

  const optimisticLead = buildOptimisticLead(out);
  store.registerColumn(out.statusId, [optimisticLead, ...currentLeads]);
}

function applyUpdateLead(
  out: UpdateLeadOutput,
  input: Record<string, unknown>,
) {
  if (!out.leadId) return;

  useKanbanStore.setState((state) => {
    const updatedColumns = { ...state.columns };

    for (const colId of Object.keys(updatedColumns)) {
      const col = updatedColumns[colId];
      const idx = col.leads.findIndex((l) => l.id === out.leadId);
      if (idx === -1) continue;

      const updatedLeads = [...col.leads];
      updatedLeads[idx] = { ...updatedLeads[idx], ...sanitizeLeadPatch(input) };
      updatedColumns[colId] = { ...col, leads: updatedLeads };
    }

    return { columns: updatedColumns };
  });
}

function applyMoveLead(out: MoveLeadOutput) {
  if (!out.leadId || !out.newStatusId) return;

  const store = useKanbanStore.getState();
  const sourceColId = store.findLeadColumn(out.leadId);
  if (!sourceColId || sourceColId === out.newStatusId) return;

  store.moveLeadToColumn(out.leadId, sourceColId, out.newStatusId);
}

/**
 * Picks only the Lead fields that are safe to patch directly from the AI
 * tool's input (the input echoes the fields that were updated).
 */
function sanitizeLeadPatch(input: Record<string, unknown>): Partial<Lead> {
  const patch: Partial<Lead> = {};
  if (typeof input.name === "string") patch.name = input.name;
  if (typeof input.email === "string") patch.email = input.email;
  if (typeof input.phone === "string") patch.phone = input.phone;
  if (typeof input.description === "string")
    patch.description = input.description;
  if (typeof input.temperature === "string")
    patch.temperature = input.temperature as Lead["temperature"];
  return patch;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useTrackingAi(trackingId: string) {
  const {
    messages,
    status,
    error,
    sendMessage,
    setMessages,
    stop,
    clearError,
  } = useChat({
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
    onFinish: ({ message }) => {
      for (const part of message.parts) {
        if (!isToolPart(part)) continue;
        if (part.state !== "output-available") continue;

        const outputPart = part as ToolOutputPart;
        const toolName = outputPart.type.slice("tool-".length);
        const output = outputPart.output as Record<string, unknown>;
        const input = (outputPart.input ?? {}) as Record<string, unknown>;

        if (!output?.success) continue;

        switch (toolName) {
          case "createLead":
            applyCreateLead(output as CreateLeadOutput);
            break;
          case "updateLead":
            applyUpdateLead(output as UpdateLeadOutput, input);
            break;
          case "moveLeadToStatus":
            applyMoveLead(output as MoveLeadOutput);
            break;
        }
      }
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
