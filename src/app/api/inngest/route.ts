import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { executeWorkflow } from "@/inngest/functions";
import { executeWorkspaceWorkflow } from "@/inngest/functions/workspace-workflow-executor";
import { bookingNotification } from "@/inngest/functions/booking-notification";
import { processUserAction } from "@/inngest/functions/process-user-action";
import { detectAbsence } from "@/inngest/functions/crons/detect-absence";
import { detectOverdue } from "@/inngest/functions/crons/detect-overdue";
import { detectChatTimeout } from "@/inngest/functions/crons/detect-chat-timeout";
import { checkStreaks } from "@/inngest/functions/crons/check-streaks";
import { checkMilestones } from "@/inngest/functions/crons/check-milestones";
import { onProposalPaid } from "@/inngest/functions/on-proposal-paid";
import { onOnboardingFormsCompleted } from "@/inngest/functions/on-onboarding-forms-completed";
import { processReminder } from "@/inngest/functions/crons/check-reminders";
import { partnerReferralActivityRecalc } from "@/inngest/functions/crons/partner-referral-activity-recalc";
import {
  partnerTierRecalcDaily,
  partnerTierRecalcMany,
  partnerTierRecalcOne,
} from "@/inngest/functions/crons/partner-tier-recalc";
import { partnerPayoutCloseCycle } from "@/inngest/functions/crons/partner-payout-close-cycle";
import { partnerGracePeriodMonitor } from "@/inngest/functions/crons/partner-grace-period-monitor";
import { syncMetaAdsKpis } from "@/inngest/functions/crons/sync-meta-ads-kpis";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    executeWorkflow,
    executeWorkspaceWorkflow,
    processReminder,
    // ── NASA Partner ──
    partnerReferralActivityRecalc,
    partnerTierRecalcDaily,
    partnerTierRecalcMany,
    partnerTierRecalcOne,
    partnerPayoutCloseCycle,
    partnerGracePeriodMonitor,
    // ── Meta Ads ──
    syncMetaAdsKpis,
    // bookingNotification,
    // processUserAction,
    // detectAbsence,
    // detectOverdue,
    // detectChatTimeout,
    // checkStreaks,
    // checkMilestones,
    // onProposalPaid,
    // onOnboardingFormsCompleted,
  ],
});
