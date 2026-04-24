import { createStation } from "./create-station";
import { updateStation } from "./update-station";
import { getStationByNick } from "./get-by-nick";
import { listStations } from "./list-stations";
import { sendStar } from "./send-star";
import { updateWorld } from "./update-world";
import { getWorld } from "./get-world";
import { getOrgChart } from "./get-org-chart";
import { updatePublicModules } from "./update-modules";
import { getMyStation } from "./get-my-station";
import { listWorldAssets, createWorldAsset, updateWorldAsset, deleteWorldAsset } from "./world-assets";
import { listAccessRequests } from "./list-access-requests";
import { handleAccessRequest } from "./handle-access-request";
import { requestStationAccess } from "./request-station-access";
import { getBubblePeersStatus } from "./get-bubble-peers-status";
import { resolvePeerAsLead } from "./resolve-peer-as-lead";
import { listMyConnections } from "./list-my-connections";
import { createUserConnection } from "./create-user-connection";
import { listOrgStationsWithLocation } from "./list-org-stations-with-location";
import { listAvatarTemplates } from "./list-avatar-templates";
import { publishWorldTemplate } from "./publish-world-template";

export const spaceStationRouter = {
  create: createStation,
  update: updateStation,
  getByNick: getStationByNick,
  list: listStations,
  sendStar,
  updateWorld,
  getWorld,
  getOrgChart,
  updateModules: updatePublicModules,
  getMy: getMyStation,
  listWorldAssets,
  createWorldAsset,
  updateWorldAsset,
  deleteWorldAsset,
  listAccessRequests,
  handleAccessRequest,
  requestAccess: requestStationAccess,
  getBubblePeersStatus,
  resolvePeerAsLead,
  listMyConnections,
  createUserConnection,
  listEmpresasMap: listOrgStationsWithLocation,
  listAvatarTemplates,
  publishWorldTemplate,
};
