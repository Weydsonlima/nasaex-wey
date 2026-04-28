import { base } from "@/app/middlewares/base";
import { requiredAuthMiddleware } from "@/app/middlewares/auth";
import { requireOrgMiddleware } from "@/app/middlewares/org";
import { awardSetupRewards } from "../utils";

export const claimSetupReward = base
  .use(requiredAuthMiddleware)
  .use(requireOrgMiddleware)
  .handler(async ({ context }) => {
    return awardSetupRewards({
      userId: context.user.id,
      orgId: context.org.id,
    });
  });
