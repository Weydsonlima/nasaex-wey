import { connectInstanceUazapi } from "./conect";
import { createInstanceUazapi } from "./create";
import { deleteInstanceUazapi } from "./delet";
import { disconnectInstanceUazapi } from "./disconect";
import { getIntegration } from "./list";
import { newNasaIntegration } from "./new-nasa-total";
import { newNasaIntegrationPartial } from "./new-nasa-partial";
import { setupMetaIntegration, getMetaIntegration } from "./setup-meta";
import { listAvailableInstances } from "./list-available";
import { oauthFinalize } from "./oauth-finalize";
import { disconnectOAuth } from "./disconnect-oauth";
import { getConnectionStatus } from "./get-connection-status";

export const integrationsRouter = {
  create: createInstanceUazapi,
  connect: connectInstanceUazapi,
  disconnect: disconnectInstanceUazapi,
  get: getIntegration,
  delete: deleteInstanceUazapi,
  newNasa: newNasaIntegration,
  newNasaPartial: newNasaIntegrationPartial,
  setupMeta: setupMetaIntegration,
  getMeta: getMetaIntegration,
  listAvailable: listAvailableInstances,
  oauthFinalize,
  disconnectOAuth,
  getConnectionStatus,
};
