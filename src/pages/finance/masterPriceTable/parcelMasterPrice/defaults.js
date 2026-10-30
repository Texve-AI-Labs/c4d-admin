export const buildWeightLabel = (minKg, maxKg) => {
  const min = toNum(minKg);
  if (maxKg === null || maxKg === "") return `${min}+ kg`;
  return `${min} to ${toNum(maxKg)} kg`;
};

export const defaultWeightRows = [
  { code: "W_0_1", minKg: 0, maxKg: 1, label: "0 to 1 kg", amount: 0 },
];

export const defaultSurcharge = (status = "INACTIVE", type = "FLAT", value = 0) => ({
  status,
  type,
  value,
});

export const defaultSimpleSurcharge = (status = "INACTIVE", value = 0) => ({
  status,
  value,
});

export const defaultNightSurcharge = (status = "INACTIVE", start = "22:00", end = "05:00", value = 0) => ({
  status,
  start,
  end,
  value,
});

export const defaultOutsideDropSurcharge = (status = "INACTIVE") => ({
  status,
  zoneToZone: { type: "FLAT", value: 0 },
  withoutZone: { type: "FLAT", value: 0 },
});

export const normalizeParcelVehicleType = (value, fallback = "BIKE") => {
  const normalized = String(value || "").trim().toUpperCase();
  if (normalized === "AUTO" || normalized === "BIKE") return normalized;
  return fallback;
};

export const createInitialParcelForm = (overrides = {}) => ({
  zone: "",
  subZoneId: "",
  parcelVehicleType: normalizeParcelVehicleType(overrides.parcelVehicleType, "BIKE"),
  baseFare: "",
  baseKm: "",
  kilometerPrice: "",
  cancelMins: "",
  cancelCharge: "",
  driverCancelMins: "",
  driverFreeCancellationsPerDay: "",
  driverCancellationCharge: "",
  peakHourEnabled: false,
  peakHour: [{ start: "", end: "", kilometerPrice: "" }],
  parcelPricing: {
    weightSurcharge: defaultWeightRows.map((row) => ({ ...row })),
    weatherSurcharge: defaultSimpleSurcharge("ACTIVE", 20),
    handlingSurcharge: defaultSimpleSurcharge("ACTIVE", 15),
    nightSurcharge: defaultNightSurcharge("ACTIVE", "22:00", "05:00", 25),
    outsideDropSurcharge: defaultOutsideDropSurcharge("INACTIVE"),
    baseFarePercent: "",
    distanceFarePercent: "",
  },
  ...overrides,
  parcelVehicleType: normalizeParcelVehicleType(overrides.parcelVehicleType, "BIKE"),
});

export const toNum = (val) => {
  if (val === "" || val === null || val === undefined) return 0;
  const parsed = Number(val);
  return Number.isFinite(parsed) ? parsed : 0;
};

const normalizeCodeNum = (value) => String(toNum(value)).replace(".", "_");

export const buildWeightCode = (minKg, maxKg) => {
  const min = normalizeCodeNum(minKg);
  if (maxKg === null || maxKg === "") return `W_${min}_PLUS`;
  const max = normalizeCodeNum(maxKg);
  return `W_${min}_${max}`;
};
