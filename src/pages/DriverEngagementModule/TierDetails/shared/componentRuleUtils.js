export const COMPONENT_TIER_KEYS = ["SILVER", "GOLD", "ELITE"];

export const COMPONENT_RULE_SERVICE_OPTIONS = [
  { label: "All", value: "ANY" },
  { label: "Hourly Package", value: "RENTAL_HOURLY_PACKAGE" },
  { label: "Round Trip", value: "RENTAL_OUTSTATION" },
  { label: "Drop Taxi", value: "RENTAL_DROP_ONLY" },
  { label: "Local", value: "RIDES" },
  { label: "Auto", value: "AUTO" },
];

export const COMPONENT_LOCKED_ANY_SERVICE_OPTIONS = [{ label: "All", value: "ANY" }];
export const COMPONENT_LOCKED_AUTO_SERVICE_OPTIONS = [{ label: "Auto", value: "AUTO" }];
export const COMPONENT_LOCKED_BIKE_SERVICE_OPTIONS = [{ label: "Bike", value: "BIKE" }];

export const isBikePartner = (partnerType = "") => String(partnerType || "").trim().toUpperCase() === "BIKE";

export const createComponentRuleCondition = ({
  metric = "onlineHours",
  period = "DAILY",
  serviceType = "ANY",
  op = ">=",
  value = "1",
  amount = "0",
  isMandatory = true,
} = {}) => ({
  metric,
  period,
  serviceType,
  op,
  value: String(value ?? ""),
  amount: String(amount ?? ""),
  isMandatory,
});

export const createTierRuleState = (payoutFrequency = "DAILY") => ({
  enabled: false,
  payoutFrequency,
  rules: [],
});

export const createComponentRuleState = ({
  payoutFrequency = "DAILY",
  enabled = true,
  applyMode = "SUM",
} = {}) => ({
  enabled,
  payoutFrequency,
  applyMode,
  tiers: {
    SILVER: createTierRuleState(payoutFrequency),
    GOLD: createTierRuleState(payoutFrequency),
    ELITE: createTierRuleState(payoutFrequency),
  },
});

export const getComponentUiServiceType = (condition = {}) => {
  const normalizedServiceType = String(condition?.serviceType || "").trim().toUpperCase();

  if (
    normalizedServiceType === "ANY" ||
    normalizedServiceType === "RIDES" ||
    normalizedServiceType === "AUTO" ||
    normalizedServiceType === "RENTAL_HOURLY_PACKAGE" ||
    normalizedServiceType === "RENTAL_OUTSTATION" ||
    normalizedServiceType === "RENTAL_DROP_ONLY"
  ) {
    return normalizedServiceType;
  }

  if (normalizedServiceType === "RENTAL" && condition?.packageType === "Local") {
    return "RENTAL_HOURLY_PACKAGE";
  }
  if (
    normalizedServiceType === "RENTAL" &&
    condition?.bookingType === "ROUND_TRIP" &&
    condition?.packageType === "Outstation"
  ) {
    return "RENTAL_OUTSTATION";
  }
  if (
    normalizedServiceType === "RENTAL" &&
    condition?.bookingType === "DROP_ONLY" &&
    condition?.packageType === "Outstation"
  ) {
    return "RENTAL_DROP_ONLY";
  }

  return normalizedServiceType || "RIDES";
};

export const buildComponentRuleConditionPayload = (rule = {}) => {
  const normalizedServiceType = String(rule?.serviceType || "").trim().toUpperCase();

  if (normalizedServiceType === "ANY") {
    return {
      serviceType: "ANY",
      bookingType: null,
      packageType: null,
    };
  }

  if (normalizedServiceType === "AUTO") {
    return {
      serviceType: "AUTO",
      bookingType: null,
      packageType: null,
    };
  }

  if (normalizedServiceType === "RIDES") {
    return {
      serviceType: "RIDES",
      bookingType: null,
      packageType: null,
    };
  }

  if (normalizedServiceType === "RENTAL_HOURLY_PACKAGE") {
    return {
      serviceType: "RENTAL",
      bookingType: null,
      packageType: "Local",
    };
  }

  if (normalizedServiceType === "RENTAL_DROP_ONLY") {
    return {
      serviceType: "RENTAL",
      bookingType: "DROP_ONLY",
      packageType: "Outstation",
    };
  }

  return {
    serviceType: "RENTAL",
    bookingType: "ROUND_TRIP",
    packageType: "Outstation",
  };
};
