import { DISPATCH_SERVICE_KEYS } from "../shared/typeConstants";

export const CONDITION_SERVICE_KEY_TO_SERVICE_TYPE = {
  ANY: "ANY",
  AUTO: "AUTO",
  BIKE: "BIKE",
  RIDES: "RIDES",
  RENTAL_HOURLY_PACKAGE: "RENTAL_HOURLY_PACKAGE",
  RENTAL_DROP_ONLY: "RENTAL_DROP_TAXI",
  RENTAL_OUTSTATION: "RENTAL",
};

export const SERVICE_TYPE_TO_CONDITION_SERVICE_KEY = {
  ANY: "ANY",
  AUTO: "AUTO",
  BIKE: "BIKE",
  RIDES: "RIDES",
  RENTAL_HOURLY_PACKAGE: "RENTAL_HOURLY_PACKAGE",
  RENTAL_DROP_TAXI: "RENTAL_DROP_ONLY",
  RENTAL: "RENTAL_OUTSTATION",
};

export const TIER_KEYS = ["SILVER", "GOLD", "ELITE"];
export const BASE_DISPATCH_SERVICE_KEY = "RIDES";
export const MIN_DISPATCH_SERVICE_ACCESS_COUNT = 1;

export const getOptionValue = (option) =>
  typeof option === "string" ? option : option?.value || "";

export const getOptionLabel = (option) =>
  typeof option === "string" ? option : option?.label || option?.value || "";

export const DISPATCH_SERVICE_VALUES = DISPATCH_SERVICE_KEYS.map((option) => getOptionValue(option)).filter(Boolean);
const DISPATCH_SERVICE_LABEL_TO_VALUE = Object.fromEntries(
  DISPATCH_SERVICE_KEYS.map((option) => [getOptionLabel(option), getOptionValue(option)])
);
const DISPATCH_SERVICE_VALUE_TO_LABEL = Object.fromEntries(
  DISPATCH_SERVICE_KEYS.map((option) => [getOptionValue(option), getOptionLabel(option)])
);

export const normalizeDispatchServiceValue = (keyOrLabel) => {
  const raw = String(keyOrLabel || "").trim();
  if (!raw) return "";

  if (raw === "Any") return "ANY";
  if (DISPATCH_SERVICE_LABEL_TO_VALUE[raw]) return DISPATCH_SERVICE_LABEL_TO_VALUE[raw];

  const upper = raw.toUpperCase();
  if (upper === "LOCAL" || upper === "RIDES") return "RIDES";
  if (upper === "ROUND_TRIP" || upper === "RENTAL" || upper === "RENTAL_OUTSTATION") return "RENTAL_OUTSTATION";
  if (upper === "DROP_TAXI" || upper === "RENTAL_DROP_TAXI" || upper === "RENTAL_DROP_ONLY") return "RENTAL_DROP_ONLY";
  if (upper === "HOURLY_PACKAGE" || upper === "RENTAL_HOURLY_PACKAGE") return "RENTAL_HOURLY_PACKAGE";
  if (upper === "ANY") return "ANY";
  if (upper === "AUTO") return "AUTO";
  if (upper === "BIKE") return "BIKE";

  return raw;
};

export const getDispatchServiceLabel = (valueOrLabel) =>
  valueOrLabel === "ANY" ? "Any" : DISPATCH_SERVICE_VALUE_TO_LABEL[valueOrLabel] || valueOrLabel;

export const getSelectedServiceAccessOptions = (tierKey, dispatchServiceAccess = {}) =>
  DISPATCH_SERVICE_VALUES.filter((serviceKey) => Boolean(dispatchServiceAccess?.[tierKey]?.[serviceKey]));

export const getConditionServiceOptions = (tierKey, unlockTargetServiceKey, dispatchServiceAccess = {}) => {
  const serviceAccessOptions = getSelectedServiceAccessOptions(tierKey, dispatchServiceAccess).filter(
    (serviceKey) => serviceKey !== unlockTargetServiceKey
  );
  if (serviceAccessOptions.length) return serviceAccessOptions;
  return DISPATCH_SERVICE_VALUES.filter((serviceKey) => serviceKey !== unlockTargetServiceKey);
};

export const getUnlockTargetOptions = (tierKey, dispatchServiceAccess = {}) =>
  DISPATCH_SERVICE_VALUES.filter((serviceKey) => {
    const tierHasAccess = Boolean(dispatchServiceAccess?.[tierKey]?.[serviceKey]);
    return tierHasAccess && serviceKey !== BASE_DISPATCH_SERVICE_KEY;
  });

export const createDispatchCondition = (conditionServiceOptions = []) => ({
  metric: "tripCount",
  period: "DAILY",
  conditionServiceKey: conditionServiceOptions[0] || "RIDES",
  op: ">=",
  value: "1",
  isMandatory: true,
});

export const createDispatchUnlockConditionsByService = () => ({});

export const getAllowedZonesBySelectedZone = (zone) => {
  if (!zone || zone === "ALL") return [];
  return [zone];
};

export const mapConditionToUi = (condition = {}) => {
  if (condition.serviceType === "ANY") return "ANY";
  if (condition.serviceType === "RIDES") return "RIDES";
  if (condition.serviceType === "RENTAL"  && condition.packageType === "Local") {
    return "RENTAL_HOURLY_PACKAGE";
  }
  if (condition.serviceType === "RENTAL" && condition.bookingType === "ROUND_TRIP" && condition.packageType === "Outstation") {
    return "RENTAL_OUTSTATION";
  }
  if (condition.serviceType === "RENTAL" && condition.bookingType === "DROP_ONLY" && condition.packageType === "Outstation") {
    return "RENTAL_DROP_ONLY";
  }
  return SERVICE_TYPE_TO_CONDITION_SERVICE_KEY[condition.serviceType] || "RIDES";
};
