import { getCurrentCompany } from "./get-current-company";
import { listMembers } from "./list-members";
import { listMembersDetailed } from "./list-members-detailed";
import { getOrgBrand } from "./get-brand";
import { updateOrgBrand } from "./update-brand";
import { getCompanyProfile } from "./get-company-profile";
import { updateCompanyProfile } from "./update-company-profile";
import { updateMemberCargo } from "./update-member-cargo";
import { updateCompanyDetails } from "./update-company-details";

export const orgRoutes = {
  listMembers,
  listMembersDetailed,
  getCurrentCompany,
  getBrand: getOrgBrand,
  updateBrand: updateOrgBrand,
  getCompanyProfile,
  updateCompanyProfile,
  updateMemberCargo,
  updateCompanyDetails,
};
