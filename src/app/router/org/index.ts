import { getCurrentCompany } from "./get-current-company";
import { listMembers } from "./list-members";
import { getOrgBrand } from "./get-brand";
import { updateOrgBrand } from "./update-brand";
import { updateCompanyDetails } from "./update-company-details";

export const orgRoutes = {
  listMembers,
  getCurrentCompany,
  getBrand: getOrgBrand,
  updateBrand: updateOrgBrand,
  updateCompanyDetails,
};
