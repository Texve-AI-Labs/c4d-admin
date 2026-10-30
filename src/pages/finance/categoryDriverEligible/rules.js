export const shouldUseDriverRules = (catalogServiceType, targetServiceType) =>
  Boolean(catalogServiceType) && catalogServiceType === targetServiceType;

export const shouldUsePackageFields = (targetServiceType) =>
  targetServiceType === "RENTAL";

export const shouldUseBookingType = (packageType) =>
  String(packageType || "").trim().toUpperCase() !== "LOCAL";
