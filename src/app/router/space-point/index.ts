export { DEFAULT_RULES, CATEGORY_LABEL } from "./defaults";

export {
  getMySpacePoint, earnSpacePoints, getSpacePointRanking, getUserStats,
  getSpacePointRules, updateSpacePointRule, createSpacePointRule, deleteSpacePointRule,
  getSpacePointPrizes, upsertSpacePointPrize, deleteSpacePointPrize,
} from "./user-routes";

export {
  adminGetSpaceOverview, adminGetOrgUsers, adminAdjustUserPoints,
  adminGetOrgRules, adminCreateOrgRule, adminUpdateOrgRule,
} from "./admin-routes";

import {
  getMySpacePoint, earnSpacePoints, getSpacePointRanking, getUserStats,
  getSpacePointRules, updateSpacePointRule, createSpacePointRule, deleteSpacePointRule,
  getSpacePointPrizes, upsertSpacePointPrize, deleteSpacePointPrize,
} from "./user-routes";

import {
  adminGetSpaceOverview, adminGetOrgUsers, adminAdjustUserPoints,
  adminGetOrgRules, adminCreateOrgRule, adminUpdateOrgRule,
} from "./admin-routes";

export const spacePointRouter = {
  me:              getMySpacePoint,
  earn:            earnSpacePoints,
  ranking:         getSpacePointRanking,
  userStats:       getUserStats,
  rules:           getSpacePointRules,
  updateRule:      updateSpacePointRule,
  createRule:      createSpacePointRule,
  deleteRule:      deleteSpacePointRule,
  prizes:          getSpacePointPrizes,
  upsertPrize:     upsertSpacePointPrize,
  deletePrize:     deleteSpacePointPrize,
  adminOverview:   adminGetSpaceOverview,
  adminOrgUsers:   adminGetOrgUsers,
  adminAdjust:     adminAdjustUserPoints,
  adminOrgRules:   adminGetOrgRules,
  adminCreateRule: adminCreateOrgRule,
  adminUpdateRule: adminUpdateOrgRule,
};
