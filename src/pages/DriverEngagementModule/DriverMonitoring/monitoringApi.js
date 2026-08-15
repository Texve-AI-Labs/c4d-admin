import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { API_ROUTES } from "@/utils/constants";

const PARTNER_TYPES = new Set(["DRIVER", "CAB", "AUTO", "BIKE", "PARCEL"]);
const TIERS = new Set(["SILVER", "GOLD", "ELITE"]);
const getPartnerTypeForQuery = (value) => {
  const normalized = String(value || "").trim().toUpperCase();
  if (!PARTNER_TYPES.has(normalized)) return "";
  return normalized;
};

export const fetchGeoData = async () => {
  const response = await ApiRequestUtils.getWithQueryParam(API_ROUTES.GEO_MARKINGS_LIST, {
    type: "Service Area",
  });

  const areas = Array.isArray(response?.data) ? response.data : [];
  return areas.filter((area) => area?.type === "Service Area");
};

export const fetchDriverMonitoringData = async ({
  page = 1,
  limit,
  partnerType,
  search = "",
  tier = "ALL",
  zone = "ALL",
  vehicleType = "ALL",
} = {}) => {
  const queryPartnerType = getPartnerTypeForQuery(partnerType);
  const normalizedTier = String(tier || "").trim().toUpperCase();
  const safeLimit = Number(limit) > 0 ? Number(limit) : 10;
  const safePage = Number(page) > 0 ? Number(page) : 1;
  const safeOffset = (safePage - 1) * safeLimit;
  const query = {
    limit: safeLimit,
    offset: safeOffset,
    search: String(search || "").trim(),
  };
  if (queryPartnerType) query.partnerType = queryPartnerType;

  if (TIERS.has(normalizedTier)) query.tier = normalizedTier;
  if (zone && zone !== "ALL") query.zone = zone;
  if (vehicleType && vehicleType !== "ALL") query.vehicleType = vehicleType;

  const response = await ApiRequestUtils.getWithQueryParam(API_ROUTES.DRIVER_MONITORING_TIER, query);
  const payload = response?.data && typeof response.data === "object" ? response.data : response || {};
  const rows = Array.isArray(payload?.rows)
    ? payload.rows
    : Array.isArray(payload?.data?.rows)
      ? payload.data.rows
      : Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(response?.data?.rows)
          ? response.data.rows
          : [];
  const cards = payload?.cards || payload?.summary || payload?.data?.cards || payload?.data?.summary || response?.cards || response?.summary || null;
  const pagination = payload?.pagination || payload?.data?.pagination || response?.pagination || {};
  const itemsPerPage = Number(pagination.itemsPerPage || pagination.limit || safeLimit);
  const totalItems = Number(pagination.totalItems || pagination.total || rows.length);
  const currentPage = Number(
    pagination.currentPage ||
    (Number.isFinite(Number(pagination.offset))
      ? Math.floor(Number(pagination.offset) / Math.max(itemsPerPage, 1)) + 1
      : safePage)
  );
  const totalPages = Number(
    pagination.totalPages || (totalItems > 0 ? Math.ceil(totalItems / Math.max(itemsPerPage, 1)) : 1)
  );

  return {
    ...response,
    data: rows,
    summary: cards,
    pagination: {
      currentPage,
      totalPages,
      totalItems,
      itemsPerPage,
    },
  };
};

export const fetchDriverTierHistory = async ({
  partnerType = "DRIVER",
  id,
  partnerId,
  limit = 10,
  offset = 0,
} = {}) => {
  const queryPartnerType = getPartnerTypeForQuery(partnerType);
  const query = {
    limit: Number(limit) > 0 ? Number(limit) : 10,
    offset: Number(offset) >= 0 ? Number(offset) : 0,
  };
  if (queryPartnerType) query.partnerType = queryPartnerType;
  if (id !== undefined && id !== null && String(id).trim() !== "") query.id = String(id);
  if (Number.isFinite(Number(partnerId))) query.partnerId = Number(partnerId);

  return ApiRequestUtils.getWithQueryParam(API_ROUTES.DRIVER_MONITORING_TIER_HISTORY, query);
};
