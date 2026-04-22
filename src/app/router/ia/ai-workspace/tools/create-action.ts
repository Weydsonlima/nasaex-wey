import prisma from "@/lib/prisma";
import { tool } from "ai";
import { z } from "zod";

export const createActionTool = (userId: string) =>
  tool({
    description:
      "Create a event with title, workspace and status. Você pode usar outros campos como data de inicio e fim, descrição, etc, mas estes não são obrigatórios. ",
    inputSchema: z.object({
      title: z.string().describe("The title of the note"),
      content: z.string().describe("The content/body of the note"),
      workspaceId: z.string().describe("The ID of the workspace"),
      columnId: z.string().describe("The ID of the column"),
    }),
    execute: async ({ title, content, workspaceId, columnId }) => {
      console.log("CREATE CREATE ACTION TOOL CALL");
      try {
        const note = await prisma.action.create({
          data: {
            user: {
              connect: {
                id: userId,
              },
            },
            title: title,
            workspace: {
              connect: {
                id: workspaceId,
              },
            },
            column: {
              connect: {
                id: columnId,
              },
            },
          },
        });

        return {
          success: true,
          message: `Note "${title}" created successfully with ID: ${note.id}`,
          noteId: note.id,
          title: note.title,
          content: note.description,
        };
      } catch (error) {
        return {
          success: false,
          message: "Failed to create note..",
          error: error instanceof Error ? error.message : "Unknow error",
        };
      }
    },
  });
