import { requiredAuthMiddleware } from "@/app/middlewares/auth";
import { base } from "@/app/middlewares/base";
import { requireOrgMiddleware } from "@/app/middlewares/org";
import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  type UIMessage,
} from "ai";
import { openai } from "@ai-sdk/openai";
import { streamToEventIterator } from "@orpc/client";
import { createActionTool } from "./tools/create-action";
import { listWorkspaces } from "./tools/list-workspaces";
import { listColumnsByWorkspace } from "./tools/list-status-by-workspace";
import { findActionTool } from "./tools/find-action-tool";
import { updateActionTool } from "./tools/update-action";
import { getOverdueActionsTool } from "./tools/get-overdue-actions";
import { moveActionToColumnTool } from "./tools/move-action-to-column";
import { getWorkspaceSummaryTool } from "./tools/get-workspace-summary";
import { closeActionTool } from "./tools/close-action";
import { addResponsibleToActionTool } from "./tools/add-responsible-to-action";
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
        "- **BUSCA E GESTÃO**: Utilize `findAction` para localizar tarefas. Para edições, use `updateAction`, `moveActionToColumn` ou `closeAction` conforme necessário.",
        "- **RESUMOS E ALERTAS**: Se o usuário pedir um status do projeto ou workspace, use `getWorkspaceSummary`. Para follow-ups de prazos, use `getOverdueActions`.",
        "- **DELEGAÇÃO**: Utilize `addResponsibleToAction` para atribuir responsáveis às tarefas.",
        "- Retorne a resposta final consolidada apenas após concluir todas as ferramentas.",
        "- Utilize duas quebras de linha (\\n\\n) entre blocos de informação.",
        "Contexto Atual:",
        `- Organização ID: ${orgId}`,
        `- Usuário ID: ${userId}`,
      ];
      const result = streamText({
        model: openai("gpt-4.1-nano"),
        messages: [
          {
            role: "system",
            content: systemPrompt.join("\n"),
          },

          ...(await convertToModelMessages(messages)),
        ],
        stopWhen: stepCountIs(4),

        tools: {
          createAction: createActionTool(userId),
          listWorkspaces: listWorkspaces(userId),
          listColumnsByWorkspace: listColumnsByWorkspace(userId),
          findAction: findActionTool(userId, initialWorkspaceId),
          updateAction: updateActionTool(userId),
          getOverdueActions: getOverdueActionsTool(userId),
          moveActionToColumn: moveActionToColumnTool(userId),
          getWorkspaceSummary: getWorkspaceSummaryTool(userId),
          closeAction: closeActionTool(userId),
          addResponsibleToAction: addResponsibleToActionTool(userId),
        },
      });

      console.log(result);

      yield* streamToEventIterator(result.toUIMessageStream());
    } catch (error) {
      console.error(error);
    }
  });
