import { createAction } from "./create";
import { listActionByColumn } from "./list-action-by-column";
import { listActionByWorkspace } from "./list-action-by-workspace";

export const actionRoutes = {
  create: createAction,
  listByColumn: listActionByColumn,
  listByWorkspace: listActionByWorkspace,
};
