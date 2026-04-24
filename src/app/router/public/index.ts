import { listPublicPlans } from "./list-plans";
import { calendarRouter } from "./calendar";

export const publicRouter = {
  listPlans: listPublicPlans,
  calendar: calendarRouter,
};
