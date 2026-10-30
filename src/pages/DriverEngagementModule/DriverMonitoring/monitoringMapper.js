import moment from "moment";

const toUpperString = (value) => String(value || "").trim().toUpperCase();

const toDisplayText = (value, fallback = "-") => {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "string") return value.trim() || fallback;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) {
    const joined = value.map((item) => toDisplayText(item, "")).filter(Boolean).join(", ");
    return joined || fallback;
  }
  if (typeof value === "object") {
    if (typeof value.name === "string" && value.name.trim()) return value.name;
    if (typeof value.type === "string" && value.type.trim()) return value.type;
    try {
      return JSON.stringify(value);
    } catch {
      return fallback;
    }
  }
  return fallback;
};

const pickDisplay = (...values) => {
  for (const value of values) {
    const text = toDisplayText(value, "");
    if (text) return text;
  }
  return "-";
};

const normalizeTier = (row) => {
  const rawTier = row?.tier

  const tier = toUpperString(rawTier);
  if (["SILVER", "GOLD", "ELITE"].includes(tier)) return tier;
  return "SILVER";
};


const formatNumber = (value, decimals = 1) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "-";
  return Number.isInteger(numeric) ? String(numeric) : numeric.toFixed(decimals);
};

const formatDateTime = (value) => {
  if (!value) return "-";
  const parsed = moment(value);
  if (!parsed.isValid()) return "-";
  return parsed.format("DD-MMM-YYYY / hh:mm A");
};

export const normalizeMonitoringRows = (rows = []) => {
  return rows.map((row, index) => {
    const id = row?._id || row?.id || row?.driverId || row?.partnerId || `driver-${index + 1}`;
    const firstName = String(row?.firstName || "").trim();
    const lastName = String(row?.lastName || "").trim();
    const nameFromParts = `${firstName} ${lastName}`.trim();
    const partnerDriver = row?.partnerRelation?.drivers?.[0] || {};

    const driverName = pickDisplay(
      nameFromParts,
      row?.partnerName,
      row?.partnerRelation?.partner?.name,
      partnerDriver?.firstName,
      partnerDriver?.lastName
    );

    const vehicle = pickDisplay(
      row?.vehicle,
      row?.partnerRelation?.partner?.driverType,
      row?.partnerRelation?.partner?.vehicleType,
      row?.partnerRelation?.partner?.name
    );

    const zone = pickDisplay(row?.zone, row?.serviceArea, row?.locationZone);

    const dailyHours = row?.dailyHours;

    const weeklyAR = row?.weeklyAR;

    const rating = row?.rating

    const outstationRaw = row?.outstationEligible

    return {
      id: String(id),
      partnerType: toUpperString(row?.partnerType || row?.partner_type || row?.partnerRelation?.partner?.type || ""),
      driver: driverName,
      tier: normalizeTier(row),
      vehicle,
      zone,
      dailyHoursDisplay: formatNumber(dailyHours),
      weeklyARDisplay: formatNumber(weeklyAR),
      ratingDisplay: formatNumber(rating),
      outstationDisplay: typeof outstationRaw === "boolean" ? (outstationRaw ? "Yes" : "No") : "-",
      evaluatedAtDisplay: formatDateTime(row?.evaluatedAt || row?.evaluated_at || row?.lastEvaluatedAt || row?.last_evaluated_at),
      updatedAtDisplay: formatDateTime(row?.updatedAt || row?.updated_at),
      raw: row,
    };
  });
};
