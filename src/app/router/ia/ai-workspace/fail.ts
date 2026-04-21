import { requiredAuthMiddleware } from "@/app/middlewares/auth";
import { base } from "@/app/middlewares/base";
import { requireOrgMiddleware } from "@/app/middlewares/org";
import prisma from "@/lib/prisma";
import { z } from "zod";
import OpenAI from "openai";
import { Prisma } from "@/generated/prisma/client";
import { tools } from "./data/tools";
import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  UIMessagePart,
  type UIMessage,
} from "ai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const createActionWithAi = base
  .use(requiredAuthMiddleware)
  .use(requireOrgMiddleware)
  .input(
    z.object({
      messages: z.array(
        z.object({
          role: z.enum(["user", "assistant", "system", "tool"]),
          content: z.string().nullable(),
          tool_call_id: z.string().optional(),
        }),
      ),
      initialWorkspaceId: z.string().optional(),
      initialColumnId: z.string().optional(),
    }),
  )
  .handler(async function* ({ input, context }) {
    const { messages, initialWorkspaceId, initialColumnId } = input;
    const orgId = context.org.id;
    const userId = context.user.id;

    const systemPrompt = `Você é o "ASTRO", o assistente inteligente da NASA.ex.

SUA PERSONA E FORMATAÇÃO:
- Profissional, focado e organizado.
- **RETORNO DE EVENTO**: Ao criar uma ação, retorne APENAS o nome do evento acompanhado do botão no formato: [VIEW_ACTION:Nome da Ação|ID_DA_AÇÃO]. Não adicione descrições longas ou resumos a menos que solicitado.
- **MARCADO (MARKDOWN)**: Use Markdown para toda a sua resposta.
- Responda em Português do Brasil.
- **NUNCA** relate erros técnicos. Trate falhas como processamento interno.

REGRAS DE RESPOSTA E FLUXO:
- PRIORIDADE DE DESTINO: Use Workspace (${initialWorkspaceId}) e Coluna (${initialColumnId}) por padrão.
- **BUSCA DE TAREFAS**: Utilize a ferramenta \`searchActions\` sempre que o usuário se referir a uma tarefa existente ou quando você precisar de contexto de ações passadas para realizar novas operações.
- Retorne a resposta final consolidada apenas após concluir todas as ferramentas.
- Utilize duas quebras de linha (\\n\\n) entre blocos de informação.

Contexto Atual:
- Organização ID: ${orgId}
- Usuário ID: ${userId}
`;

    const chatMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
      ...messages.map(
        (m) =>
          ({
            role: m.role,
            content: m.content,
            ...(m.tool_call_id ? { tool_call_id: m.tool_call_id } : {}),
          }) as OpenAI.Chat.ChatCompletionMessageParam,
      ),
    ];

    let runLoop = true;
    while (runLoop) {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: chatMessages,
        tools,
        stream: true,
      });

      let fullContent = "";
      let toolCalls: any[] = [];

      for await (const chunk of response) {
        const delta = chunk.choices[0]?.delta;
        if (delta?.content) fullContent += delta.content;
        if (delta?.tool_calls) {
          for (const tc of delta.tool_calls) {
            if (tc.index !== undefined) {
              if (!toolCalls[tc.index]) {
                toolCalls[tc.index] = {
                  id: tc.id,
                  function: { name: "", arguments: "" },
                };
              }
              if (tc.function?.name)
                toolCalls[tc.index].function.name += tc.function.name;
              if (tc.function?.arguments)
                toolCalls[tc.index].function.arguments += tc.function.arguments;
            }
          }
        }
      }

      if (toolCalls.length > 0) {
        yield "Estou organizando tudo por aqui... 🚀\n\n";

        chatMessages.push({
          role: "assistant",
          content: fullContent || null,
          tool_calls: toolCalls.map((tc) => ({
            id: tc.id,
            type: "function",
            function: tc.function,
          })),
        } as OpenAI.Chat.ChatCompletionAssistantMessageParam);

        for (const toolCall of toolCalls) {
          const name = toolCall.function.name;
          const args = JSON.parse(toolCall.function.arguments || "{}");
          let result = "";

          try {
            if (name === "listWorkspaces") {
              const workspaces = await prisma.workspace.findMany({
                where: { organizationId: orgId, isArchived: false },
                select: { id: true, name: true },
              });
              result = JSON.stringify(workspaces);
            } else if (name === "listColumns") {
              const columns = await prisma.workspaceColumn.findMany({
                where: { workspaceId: args.workspaceId },
                orderBy: { order: "asc" },
                select: { id: true, name: true },
              });
              result = JSON.stringify(columns);
            } else if (name === "searchActions") {
              const actions = await prisma.action.findMany({
                where: {
                  organizationId: orgId,
                  isArchived: false,
                  workspaceId: args.workspaceId || undefined,
                  OR: [
                    { title: { contains: args.query, mode: "insensitive" } },
                    {
                      description: {
                        contains: args.query,
                        mode: "insensitive",
                      },
                    },
                  ],
                },
                take: 10,
                select: {
                  id: true,
                  title: true,
                  description: true,
                  workspaceId: true,
                  columnId: true,
                },
              });
              result = JSON.stringify(actions);
            } else if (name === "createAction") {
              const lastAction = await prisma.action.findFirst({
                where: {
                  columnId: args.columnId,
                  workspaceId: args.workspaceId,
                },
                orderBy: { order: "asc" },
              });
              const newOrder = lastAction
                ? Prisma.Decimal.sub(lastAction.order, 1)
                : new Prisma.Decimal(0);
              const action = await prisma.action.create({
                data: {
                  title: args.title,
                  description: args.description,
                  priority: (args.priority as any) || "MEDIUM",
                  workspaceId: args.workspaceId,
                  columnId: args.columnId,
                  dueDate: args.dueDate ? new Date(args.dueDate) : null,
                  createdBy: userId,
                  order: newOrder,
                  organizationId: orgId,
                  participants: { create: { userId } },
                },
              });
              result = `Ação "${action.title}" criada com sucesso ID: ${action.id}.`;
            } else if (name === "archiveAction") {
              await prisma.action.update({
                where: { id: args.actionId },
                data: { isArchived: true, closedAt: new Date() },
              });
              result = `Ação arquivada com sucesso.`;
            }
            chatMessages.push({
              role: "tool",
              tool_call_id: toolCall.id,
              content: result,
            });
          } catch (err: any) {
            chatMessages.push({
              role: "tool",
              tool_call_id: toolCall.id,
              content: `Concluído internamente.`,
            });
          }
        }
      } else {
        if (fullContent) yield fullContent;
        runLoop = false;
      }
    }
  });
