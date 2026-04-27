import prisma from "@/lib/prisma";
import { NodeType } from "@/generated/prisma/enums";
import { tool } from "ai";
import { z } from "zod";

export const addNodeTool = () =>
  tool({
    description: `Adiciona um nó (trigger ou ação) a um workflow existente.

TIPOS DE NÓ E SCHEMA DO CAMPO "data":

TRIGGERS (use exatamente um como primeiro nó):
- MANUAL_TRIGGER  → data: {}
- NEW_LEAD        → data: {}
- AI_FINISHED     → data: {}
- MOVE_LEAD_STATUS → data: { statusId: "id_do_status" }
- LEAD_TAGGED     → data: { tagId: "id_da_tag" }

EXECUÇÕES:
- MOVE_LEAD       → data: { trackingId: "id", statusId: "id_do_status_destino" }
- SEND_MESSAGE    → data: { type: "TEXT", message: "texto da mensagem" }
                    Variáveis disponíveis na mensagem: {{name}}, {{email}}, {{phone}}, {{status}}
- WAIT            → data: { type: "MINUTES" | "HOURS" | "DAYS" | "WEEKS", value: number }
- WIN_LOSS        → data: { type: "WIN" | "LOSS", reasonId: "id_opcional" }
- TAG             → data: { operation: "ADD" | "REMOVE", tagIds: ["id1","id2"] }
- TEMPERATURE     → data: { temperature: "COLD" | "WARM" | "HOT" | "VERY_HOT" }
- RESPONSIBLE     → data: { operation: "ADD" | "REMOVE", userId: "id_do_usuario" }
- FILTER_LEAD     → data: { conditions: [{ field: "status"|"name"|"email", operator: "is"|"contains", value: "..." }] }`,
    inputSchema: z.object({
      workflowId: z.string().describe("ID do workflow onde o nó será adicionado"),
      type: z.nativeEnum(NodeType).describe("Tipo do nó conforme a lista acima"),
      name: z.string().describe("Nome descritivo do nó, ex: 'Enviar boas-vindas'"),
      data: z
        .record(z.unknown())
        .default({})
        .describe("Configuração do nó conforme o schema do tipo escolhido"),
      position: z
        .object({ x: z.number(), y: z.number() })
        .default({ x: 0, y: 0 })
        .describe("Posição visual no canvas (opcional)"),
    }),
    execute: async ({ workflowId, type, name, data, position }) => {
      try {
        const workflow = await prisma.workflow.findUnique({
          where: { id: workflowId },
          select: { id: true },
        });

        if (!workflow) {
          return {
            success: false,
            message: `Workflow "${workflowId}" não encontrado.`,
          };
        }

        const node = await prisma.node.create({
          data: {
            workflowId,
            type,
            name,
            data,
            position,
          },
          select: { id: true, type: true, name: true },
        });

        return {
          success: true,
          message: `Nó "${name}" (${type}) adicionado com sucesso.`,
          nodeId: node.id,
          type: node.type,
          name: node.name,
        };
      } catch (error) {
        return {
          success: false,
          message: "Não foi possível adicionar o nó.",
          error: error instanceof Error ? error.message : "Erro desconhecido",
        };
      }
    },
  });
