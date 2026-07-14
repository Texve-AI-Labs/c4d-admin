export const getOptionValue = (option) =>
  typeof option === "string" ? option : option?.value || "";

export const getOptionLabel = (option) =>
  typeof option === "string" ? option : option?.label || option?.value || "";

export const createIncentiveRule = ({
  metric = "onlineHours",
  period = "WEEKLY",
  serviceType = "RIDES",
  op = ">=",
  value = 1,
  amount = 100,
} = {}) => ({
  metric,
  period,
  serviceType,
  op,
  value,
  amount,
});

export const getUiServiceType = (condition = {}) => {
  if (condition.serviceType === "ANY") return "ANY";
  if (condition.serviceType === "RIDES") return "RIDES";
  if (condition.serviceType === "RENTAL" && condition.bookingType === "DROP_ONLY" && condition.packageType === "Local") {
    return "RENTAL_HOURLY_PACKAGE";
  }
  if (condition.serviceType === "RENTAL" && condition.bookingType === "ROUND_TRIP" && condition.packageType === "Outstation") {
    return "RENTAL";
  }
  if (condition.serviceType === "RENTAL" && condition.bookingType === "DROP_ONLY" && condition.packageType === "Outstation") {
    return "RENTAL_DROP_TAXI";
  }
  return condition.serviceType || "RIDES";
};

export const LOCKED_SERVICE_TYPE_OPTIONS = [{ label: "All", value: "ANY" }];
export const AUTO_LOCKED_SERVICE_TYPE_OPTIONS = [{ label: "Auto", value: "AUTO" }];
export const BIKE_LOCKED_SERVICE_TYPE_OPTIONS = [{ label: "Bike", value: "BIKE" }];

export const getLockedServiceTypeOptions = (partnerType = "") => {
  const normalized = String(partnerType || "").trim().toUpperCase();
  if (normalized === "BIKE") return BIKE_LOCKED_SERVICE_TYPE_OPTIONS;
  return AUTO_LOCKED_SERVICE_TYPE_OPTIONS;
};
