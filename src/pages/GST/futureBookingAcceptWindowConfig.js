export const ACCEPT_WINDOW_TYPE = "FUTURE_BOOKING_ACCEPT_WINDOW";
export const ACCEPT_WINDOW_PATH = "/dashboard/finance/future-booking-accept-window";
export const BOOKING_TYPES = ["DROP ONLY", "ROUND TRIP"];
export const SERVICE_TYPES = ["AUTO", "RIDES", "BIKE", "RENTAL", "DRIVER"];

export const ACCEPT_WINDOW_LABELS = {
  "DROP ONLY": "Drop Taxi",
  "ROUND TRIP": "Outstation",
  RENTAL: "Hourly Package",
  DRIVER: "Acting Driver",
  AUTO: "Auto",
  RIDES: "Rides",
  BIKE: "Bike",
};

export const isPositiveMinutes = (value) => String(value).trim() !== "" && Number.isSafeInteger(Number(value)) && Number(value) > 0;

export function createAcceptWindowValues(record = {}) {
  const config = record.config || {};
  const byBookingType = Object.fromEntries(BOOKING_TYPES.map((key) => [key, config.byBookingType?.[key] ?? 30]));
  const byServiceType = Object.fromEntries(SERVICE_TYPES.map((key) => [key, config.byServiceType?.[key] ?? 30]));
  return {
    description: record.description || "",
    isActive: record.isActive ?? true,
    byBookingType,
    byServiceType,
  };
}

export function validateAcceptWindow(values) {
  const errors = {};
  if (!values.description.trim()) errors.description = "Description is required";
  for (const [group, keys] of [["byBookingType", BOOKING_TYPES], ["byServiceType", SERVICE_TYPES]]) {
    const invalid = Object.fromEntries(keys.filter((key) => !isPositiveMinutes(values[group][key])).map((key) => [key, "Enter a whole number greater than 0"]));
    if (Object.keys(invalid).length) errors[group] = invalid;
  }
  return errors;
}

export function buildAcceptWindowPayload(values, record = {}) {
  return {
    ...(record.id != null ? { settingId: record.id } : {}),
    serviceType: "ALL",
    type: ACCEPT_WINDOW_TYPE,
    name: ACCEPT_WINDOW_TYPE,
    description: values.description.trim(),
    config: {
      byBookingType: Object.fromEntries(BOOKING_TYPES.map((key) => [key, Number(values.byBookingType[key])])),
      byServiceType: Object.fromEntries(SERVICE_TYPES.map((key) => [key, Number(values.byServiceType[key])])),
      defaultMinutes: 30,
    },
    isActive: values.isActive === true || values.isActive === "true",
  };
}
