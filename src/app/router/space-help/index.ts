import { listCategories } from "./routes/list-categories";
import { getFeature } from "./routes/get-feature";
import { listTracks } from "./routes/list-tracks";
import { getTrack } from "./routes/get-track";
import { listUserBadges } from "./routes/list-user-badges";
import { listBadges } from "./routes/list-badges";
import { markLessonComplete } from "./routes/mark-lesson-complete";
import { upsertCategory } from "./routes/upsert-category";
import { upsertFeature } from "./routes/upsert-feature";
import { upsertStep } from "./routes/upsert-step";
import { upsertTrack } from "./routes/upsert-track";
import { upsertLesson } from "./routes/upsert-lesson";
import { upsertBadge } from "./routes/upsert-badge";
import { setYoutubeUrl } from "./routes/set-youtube-url";
import { checkModerator } from "./routes/check-moderator";
import { getSetupProgress } from "./routes/get-setup-progress";
import { claimSetupReward } from "./routes/claim-setup-reward";

export const spaceHelpRouter = {
  listCategories,
  getFeature,
  listTracks,
  getTrack,
  listUserBadges,
  listBadges,
  markLessonComplete,
  upsertCategory,
  upsertFeature,
  upsertStep,
  upsertTrack,
  upsertLesson,
  upsertBadge,
  setYoutubeUrl,
  checkModerator,
  getSetupProgress,
  claimSetupReward,
};
