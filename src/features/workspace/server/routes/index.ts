import { createWorkspace } from "./create";
import { getColumnsByWorkspace } from "./get-columns-by-workspace";
import { getWorkspace } from "./get";
import { listWorkspace } from "./list";
import { getWorkspaceMembers } from "./get-members";

export const workspaceRoutes = {
  list: listWorkspace,
  create: createWorkspace,
  get: getWorkspace,
  getColumnsByWorkspace,
  getMembers: getWorkspaceMembers,
};
