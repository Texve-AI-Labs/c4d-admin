export const getOptionValue = (option) =>
  typeof option === "string" ? option : option?.value || "";

export const getOptionLabel = (option) =>
  typeof option === "string" ? option : option?.label || option?.value || "";

const isOnlineHoursCode = (code = "") =>
  code === "ONLINE_HOURS_BONUS" || code === "ONLINE_HOURS_RULES";

const isAutoPartnerType = (partnerType = "") =>
  String(partnerType || "").trim().toUpperCase() === "AUTO";

const normalizeText = (value = "") => String(value || "").trim().toUpperCase();

export const getUiServiceType = (condition = {}) => {
  const serviceType = normalizeText(condition?.serviceType);
  const packageType = normalizeText(condition?.packageType);
  const bookingType = normalizeText(condition?.bookingType);

  if (serviceType === "ANY" || serviceType === "RIDES" || serviceType === "AUTO") {
    return serviceType || "RIDES";
  }

  if (serviceType === "RENTAL_HOURLY_PACKAGE") return "RENTAL_HOURLY_PACKAGE";
  if (serviceType === "RENTAL_DROP_TAXI") return "RENTAL_DROP_TAXI";
  if (serviceType === "RENTAL_OUTSTATION") return "RENTAL_OUTSTATION";

  if (serviceType === "RENTAL") {
    if (packageType === "LOCAL") return "RENTAL_HOURLY_PACKAGE";
    if (packageType === "OUTSTATION" && bookingType === "DROP_ONLY") return "RENTAL_DROP_TAXI";
    if (packageType === "OUTSTATION" && bookingType === "ROUND_TRIP") return "RENTAL_OUTSTATION";
    return "RENTAL_OUTSTATION";
  }

  return serviceType || "RIDES";
};

export const getServiceConditionDetails = (serviceType = "") => {
  const normalizedServiceType = normalizeText(serviceType);

  if (normalizedServiceType === "RENTAL_HOURLY_PACKAGE") {
    return { bookingType: null, packageType: "Local" };
  }

  if (normalizedServiceType === "RENTAL_DROP_TAXI") {
    return { bookingType: "DROP_ONLY", packageType: "Outstation" };
  }

  if (normalizedServiceType === "RENTAL_OUTSTATION" || normalizedServiceType === "RENTAL") {
    return { bookingType: "ROUND_TRIP", packageType: "Outstation" };
  }

  return { bookingType: null, packageType: null };
};

export const getTargetComponent = (row = {}, selectedCode = "") => {
  const components = Array.isArray(row?.components)
    ? row.components
    : row?.component && typeof row.component === "object"
      ? [row.component]
      : [];

  if (!components.length) return null;
  if (!selectedCode) return components[0];
  return components.find((item) => item?.code === selectedCode) || components[0];
};

export const createEditableRule = (rule = {}, code = "", partnerType = "CAB") => {
  const condition = rule?.condition || {};
  const fallbackMetric = isOnlineHoursCode(code) ? "onlineHours" : "tripCount";
  const fallbackServiceType = isAutoPartnerType(partnerType)
    ? "AUTO"
    : isOnlineHoursCode(code)
      ? "ANY"
      : "RIDES";
  const uiServiceType = getUiServiceType(condition) || fallbackServiceType;
  return {
    metric: condition?.metric || fallbackMetric,
    period: condition?.period || "WEEKLY",
    serviceType: uiServiceType || fallbackServiceType,
    op: condition?.op || ">=",
    value: String(condition?.value ?? ""),
    amount: String(rule?.amount ?? ""),
    bookingType: condition?.bookingType || null,
    packageType: condition?.packageType || null,
  };
};

export const createDefaultRule = (code = "", partnerType = "CAB") =>
  createEditableRule(
    {
      condition: {
        metric: isOnlineHoursCode(code) ? "onlineHours" : "tripCount",
        period: "WEEKLY",
        serviceType: isAutoPartnerType(partnerType)
          ? "AUTO"
          : isOnlineHoursCode(code)
            ? "ANY"
            : "RIDES",
        op: ">=",
        value: 1,
      },
      amount: 100,
    },
    code,
    partnerType
  );

export const withCurrentOption = (options = [], currentValue = "") => {
  const value = String(currentValue || "").trim();
  if (!value) return options;
  const exists = options.some((option) => getOptionValue(option) === value);
  return exists ? options : [{ value, label: value }, ...options];
};
