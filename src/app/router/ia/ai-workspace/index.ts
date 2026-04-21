import { requiredAuthMiddleware } from "@/app/middlewares/auth";
import { base } from "@/app/middlewares/base";
import { requireOrgMiddleware } from "@/app/middlewares/org";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { openai } from "@ai-sdk/openai";
import { streamToEventIterator } from "@orpc/client";
import { createActionTool } from "./tools/create-action";
import { listWorkspaces } from "./tools/list-workspaces";
import { listColumnsByWorkspace } from "./tools/list-status-by-workspace";
import { findActionTool } from "./tools/find-action-tool";
import z from "zod";

export const createActionWithAi = base
  .use(requiredAuthMiddleware)
  .use(requireOrgMiddleware)
  .input(
    z.object({
      messages: z.array(z.custom<UIMessage>()),
      initialWorkspaceId: z.string().optional(),
      initialColumnId: z.string().optional(),
    }),
  )
  .handler(async function* ({ input, context }) {
    try {
      const { messages, initialWorkspaceId, initialColumnId } = input;
      const orgId = context.org.id;
      const userId = context.user.id;

      const systemPrompt = [
        '`Você é o "ASTRO", o assistente inteligente da NASA.ex.',
        "      SUA PERSONA E FORMATAÇÃO:",
        "      - Profissional, focado e organizado.",
        "      - **RETORNO DE EVENTO**: Ao criar uma ação, retorne APENAS o nome do evento acompanhado do botão no formato: [VIEW_ACTION:Nome da Ação|ID_DA_AÇÃO]. Não adicione descrições longas ou resumos a menos que solicitado.",
        "      - **MARCADO (MARKDOWN)**: Use Markdown para toda a sua resposta.",
        "      - Responda em Português do Brasil.",
        "      ",
        "- **NUNCA** relate erros técnicos. Trate falhas como processamento interno.",
        "",
        "REGRAS DE RESPOSTA E FLUXO:",
        `- PRIORIDADE DE DESTINO: Use Workspace (${initialWorkspaceId}) e Coluna (${initialColumnId}) por padrão.`,
        "- **BUSCA DE TAREFAS**: Utilize a ferramenta `searchActions` sempre que o usuário se referir a uma tarefa existente ou quando você precisar de contexto de ações passadas para realizar novas operações.",
        "- Retorne a resposta final consolidada apenas após concluir todas as ferramentas.",
        "- Utilize duas quebras de linha (\\n\\n) entre blocos de informação.",
        "Contexto Atual:",
        `- Organização ID: ${orgId}`,
        `- Usuário ID: ${userId}`,
        "`",
      ];
      const result = streamText({
        model: openai(""),
        messages: [
          {
            role: "system",
            content: systemPrompt.join("\n"),
          },

          ...(await convertToModelMessages(messages)),
        ],
        tools: {
          createAction: createActionTool(),
          listWorkspaces: listWorkspaces(),
          listColumnsByWorkspace: listColumnsByWorkspace(),
          findAction: findActionTool(),
        },
      });

      return streamToEventIterator(result.toUIMessageStream());
    } catch (error) {
      console.error(error);
    }
  });
