import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { API_ROUTES } from "@/utils/constants";

export const getCategoryDriverEligibleList = (params = {}) =>
  ApiRequestUtils.getWithQueryParam(API_ROUTES.SERVICE_CATEGORY_CATALOG, params);

export const getCategoryDriverEligibleById = (id) =>
  ApiRequestUtils.get(`${API_ROUTES.SERVICE_CATEGORY_CATALOG}/${id}`);

export const createCategoryDriverEligible = (payload) =>
  // console.log("createCategoryDriverEligible payload:", payload) ||
  ApiRequestUtils.post(API_ROUTES.SERVICE_CATEGORY_CATALOG, payload, 0, { suppressAlert: true });

export const updateCategoryDriverEligible = (payload) =>
  ApiRequestUtils.update(API_ROUTES.SERVICE_CATEGORY_CATALOG, payload, 0, { suppressAlert: true });
