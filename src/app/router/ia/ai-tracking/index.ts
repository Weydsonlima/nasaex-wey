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
import z from "zod";
import { createLeadTool } from "./tools/create-lead";
import { findLeadsTool } from "./tools/find-leads";
import { updateLeadTool } from "./tools/update-lead";
import { moveLeadToStatusTool } from "./tools/move-lead-to-status";
import { listStatusesTool } from "./tools/list-statuses";

export const createLeadWithAi = base
  .use(requiredAuthMiddleware)
  .use(requireOrgMiddleware)
  .input(
    z.object({
      messages: z.array(z.custom<UIMessage>()),
      trackingId: z.string(),
    }),
  )
  .handler(async function* ({ input, context, errors }) {
    try {
      const { messages, trackingId } = input;
      const orgId = context.org.id;
      const userId = context.user.id;

      const systemPrompt = [
        'Você é o "ASTRO", o assistente inteligente da NASA.ex especializado em gestão de leads e funis de vendas.',

        "SUA PERSONA E FORMATAÇÃO:",
        "- Profissional, focado em vendas e relacionamento com clientes.",
        "- **RETORNO DE LEAD**: Ao criar ou encontrar um lead, retorne o nome acompanhado do botão no formato: [VIEW_LEAD:Nome do Lead|ID_DO_LEAD].",
        "- **MARKDOWN**: Use Markdown para toda a resposta.",
        "- Responda em Português do Brasil.",

        "REGRAS DE RESPOSTA E FLUXO:",
        `- PRIORIDADE: Todas as operações são dentro do Tracking ID: ${trackingId}.`,
        "- **BUSCA**: Utilize `findLeads` para localizar leads por nome, e-mail ou telefone.",
        "- **CRIAÇÃO**: Utilize `createLead` para criar novos leads. Antes de criar, use `listStatuses` para obter o statusId da primeira coluna. Solicite ao menos o nome e telefone ao usuário antes de criar.",
        "- **ATUALIZAÇÃO**: Utilize `updateLead` para editar campos do lead (nome, email, telefone, descrição, valor, temperatura).",
        "- **MOVIMENTAÇÃO**: Utilize `moveLeadToStatus` para mover um lead entre colunas. Use `listStatuses` para conhecer as colunas disponíveis antes de mover.",
        "- **COLUNAS**: Antes de mover ou criar um lead (quando não souber o statusId), use `listStatuses` para descobrir os IDs e nomes das colunas.",
        "- Retorne a resposta final consolidada apenas após concluir todas as ferramentas.",
        "- Utilize duas quebras de linha (\\n\\n) entre blocos de informação.",
        "- Se `findLeads` retornar lista vazia, informe ao usuário em linguagem natural.",
        "- Se o usuário não fornecer dados suficientes para criar um lead, pergunte apenas o mínimo necessário (nome e telefone).",

        "TRATAMENTO DE ERROS E ESCOPO:",
        "- **NUNCA** exiba erros técnicos, IDs internos, stack traces ou mensagens de sistema.",
        "- Se uma tool retornar erro ou nenhum resultado, reformule em linguagem natural amigável.",
        "- Se o usuário pedir algo fora do escopo de CRM/leads, responda simpaticamente que você é especializado em gestão de leads.",
        "- Nunca invente dados. Se não souber, pergunte.",

        "Contexto Atual:",
        `- Organização ID: ${orgId}`,
        `- Tracking ID: ${trackingId}`,
        `- Usuário ID: ${userId}`,
      ].join("\n");

      const result = streamText({
        model: openai("gpt-4.1-nano"),
        messages: [
          { role: "system", content: systemPrompt },
          ...(await convertToModelMessages(messages)),
        ],
        stopWhen: stepCountIs(5),
        toolChoice: "auto",
        tools: {
          listStatuses: listStatusesTool(trackingId),
          createLead: createLeadTool(userId, trackingId),
          findLeads: findLeadsTool(trackingId),
          updateLead: updateLeadTool(userId),
          moveLeadToStatus: moveLeadToStatusTool(userId),
        },
      });

      yield* streamToEventIterator(result.toUIMessageStream());
    } catch (error) {
      console.error(error);
      throw errors.INTERNAL_SERVER_ERROR;
    }
  });
