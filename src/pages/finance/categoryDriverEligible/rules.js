export const shouldUseDriverRules = (catalogServiceType, targetServiceType) =>
  Boolean(catalogServiceType) && catalogServiceType === targetServiceType;

export const shouldUseBookingType = (packageType) =>
  String(packageType || "").trim().toUpperCase() !== "LOCAL";
