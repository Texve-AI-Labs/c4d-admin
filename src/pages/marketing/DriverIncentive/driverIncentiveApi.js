import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { API_ROUTES } from "@/utils/constants";

export const DRIVER_INCENTIVE_CODES = [
  "ONLINE_HOURS_RULES",
  "SERVICE_TRIP_RULES",
];

const toApiCode = (code = "") =>
  code === "ONLINE_HOURS_RULES"
    ? "ONLINE_HOURS_BONUS"
    : code === "SERVICE_TRIP_RULES"
      ? "SERVICE_TRIP_BONUS"
      : code;

export const fetchDriverIncentiveList = async ({
  code = "ONLINE_HOURS_RULES",
  partnerType = "CAB",
  zone = "",
  vehicleType = "ALL",
  parcelVehicleType,
  isActive,
  settingId,
} = {}) => {
  const params = {
    code: toApiCode(code),
    mode:"RULES",
    partnerType,
    zone,
    vehicleType,
  };
  if (typeof parcelVehicleType === "string" && parcelVehicleType.trim()) {
    params.parcelVehicleType = parcelVehicleType.trim().toUpperCase();
  }

  if (settingId !== undefined && settingId !== null && settingId !== "") {
    params.settingId = settingId;
  }
  if (typeof isActive === "boolean") {
    params.isActive = isActive;
  }

  const response = await ApiRequestUtils.getWithQueryParam(API_ROUTES.DRIVER_INCENTIVE, params);
  return response || {};
};

export const updateDriverIncentiveComponent = async ({
  settingId,
  name,
  type,
  description,
  isActive = true,
  scope = {},
  component = {},
}) => {
  const payload = {
    component: {
      ...(component || {}),
      code: toApiCode(component?.code || ""),
    },
  };

  if (settingId !== undefined && settingId !== null && settingId !== "") {
    payload.settingId = Number(settingId);
  }

  if (typeof name === "string" && name.trim()) {
    payload.name = name.trim();
  }
  if (typeof type === "string" && type.trim()) {
    payload.type = type.trim();
  }
  if (typeof description === "string" && description.trim()) {
    payload.description = description.trim();
  }
  payload.isActive = Boolean(isActive);
  payload.scope = scope && typeof scope === "object" ? scope : {};

  const response = await ApiRequestUtils.update(API_ROUTES.DRIVER_INCENTIVE_EDIT, payload);
  return response || {};
};

export const updateDriverIncentiveStatus = async ({
  settingId,
  code,
  enabled,
  scope = {},
}) => {
  const parsedSettingId = Number(settingId);
  if (!Number.isFinite(parsedSettingId) || parsedSettingId <= 0) {
    throw new Error("settingId is required for status update");
  }

  const payload = {
    settingId: parsedSettingId,
    code: toApiCode(code),
    enabled: Boolean(enabled),
  };

  if (scope && typeof scope === "object") {
    payload.scope = scope;
  }

  const response = await ApiRequestUtils.patch(API_ROUTES.DRIVER_INCENTIVE_STATUS, payload);
  return response || {};
};

export const createDriverIncentiveRule = async (input = {}) => {
  const payload =
    input && typeof input === "object" && (input.component || input.scope)
      ? {
          ...input,
          name: String(input.name || "").trim(),
          description: String(input.description || "").trim(),
          isActive: Boolean(input.isActive),
        }
      : {
          type: input?.type || "ONLINE_HOURS_RULES",
          name: String(input?.name || "").trim(),
          description: String(input?.description || "").trim(),
          isActive: Boolean(input?.isActive),
          config: input?.config && typeof input.config === "object" ? input.config : {},
        };

  const response = await ApiRequestUtils.post(API_ROUTES.ADD_DE_TIER, payload);
  return response || {};
};
