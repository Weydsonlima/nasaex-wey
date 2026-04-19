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
};
