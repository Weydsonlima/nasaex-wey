import prisma from "@/lib/prisma";
import { tool } from "ai";
import { z } from "zod";

export const findActionTool = () =>
  tool({
    description:
      "Search for actions/tasks based on filters. Use this to find tasks by title, status, priority, dates, workspace, column, lead, project, etc. Returns a list of actions matching the provided filters.",
    inputSchema: z.object({
      // Required identifiers
      workspaceId: z
        .string()
        .describe("Workspace ID (required to scope the search)"),
      userId: z.string().describe("ID of the user performing the search"),

      // Text filters
      title: z
        .string()
        .optional()
        .describe("Search by title (partial match, case-insensitive)"),

      // Status / type filters
      isDone: z
        .boolean()
        .optional()
        .describe("Filter by completed (true) or pending (false) tasks"),
      isArchived: z.boolean().optional().describe("Filter by archived tasks"),
      isFavorited: z.boolean().optional().describe("Filter by favorited tasks"),
      priority: z
        .enum(["NONE", "LOW", "MEDIUM", "HIGH", "URGENT"])
        .optional()
        .describe("Filter by task priority"),

      // Relationship filters
      columnId: z.string().optional().describe("Filter by column ID"),
      leadId: z.string().optional().describe("Filter by related lead ID"),
      orgProjectId: z
        .string()
        .optional()
        .describe("Filter by organization project ID"),
      organizationId: z
        .string()
        .optional()
        .describe("Filter by organization ID"),

      // Due date range
      dueDateFrom: z
        .string()
        .optional()
        .describe("Due date start range (ISO 8601, e.g. 2024-01-01)"),
      dueDateTo: z
        .string()
        .optional()
        .describe("Due date end range (ISO 8601, e.g. 2024-12-31)"),

      // Start date range
      startDateFrom: z
        .string()
        .optional()
        .describe("Start date range from (ISO 8601)"),
      startDateTo: z
        .string()
        .optional()
        .describe("Start date range to (ISO 8601)"),

      // Pagination
      limit: z
        .number()
        .min(1)
        .max(50)
        .default(10)
        .describe("Maximum number of results to return (default: 10)"),
      offset: z.number().min(0).default(0).describe("Pagination offset"),
    }),
    execute: async ({
      workspaceId,
      userId,
      title,
      isDone,
      isArchived,
      isFavorited,
      priority,
      columnId,
      leadId,
      orgProjectId,
      organizationId,
      dueDateFrom,
      dueDateTo,
      startDateFrom,
      startDateTo,
      limit,
      offset,
    }) => {
      console.log("FIND ACTION TOOL CALL");
      try {
        const actions = await prisma.action.findMany({
          where: {
            workspaceId,

            // Only return actions where the user is the creator, a participant, or a responsible
            OR: [
              { createdBy: userId },
              { participants: { some: { userId } } },
              { responsibles: { some: { userId } } },
            ],

            // Optional filters — only applied when provided
            ...(title && {
              title: { contains: title, mode: "insensitive" },
            }),
            ...(isDone !== undefined && { isDone }),
            ...(isArchived !== undefined && { isArchived }),
            ...(isFavorited !== undefined && { isFavorited }),
            ...(priority && { priority }),
            ...(columnId && { columnId }),
            ...(leadId && { leadId }),
            ...(orgProjectId && { orgProjectId }),
            ...(organizationId && { organizationId }),

            // Due date range filter
            ...((dueDateFrom || dueDateTo) && {
              dueDate: {
                ...(dueDateFrom && { gte: new Date(dueDateFrom) }),
                ...(dueDateTo && { lte: new Date(dueDateTo) }),
              },
            }),

            // Start date range filter
            ...((startDateFrom || startDateTo) && {
              startDate: {
                ...(startDateFrom && { gte: new Date(startDateFrom) }),
                ...(startDateTo && { lte: new Date(startDateTo) }),
              },
            }),
          },
          orderBy: [{ order: "asc" }, { createdAt: "desc" }],
          take: limit,
          skip: offset,
          select: {
            id: true,
            title: true,
            description: true,
            isDone: true,
            type: true,
            priority: true,
            dueDate: true,
            startDate: true,
            endDate: true,
            columnId: true,
            isArchived: true,
            isFavorited: true,
            createdAt: true,
            column: {
              select: { id: true, name: true },
            },
          },
        });

        if (actions.length === 0) {
          return {
            success: true,
            message: "No actions found matching the provided filters.",
            actions: [],
            total: 0,
          };
        }

        return {
          success: true,
          message: `${actions.length} action(s) found.`,
          actions,
          total: actions.length,
        };
      } catch (error) {
        return {
          success: false,
          message: "Failed to fetch actions.",
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
  });
