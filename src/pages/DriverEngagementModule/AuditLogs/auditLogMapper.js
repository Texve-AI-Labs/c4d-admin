import moment from "moment";

const toUpper = (value) => String(value || "").trim().toUpperCase();

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

const formatDateTime = (value) => {
  if (!value) return "-";
  const parsed = moment(value);
  if (!parsed.isValid()) return "-";
  return parsed.format("DD-MMM-YYYY / hh:mm A");
};

const normalizeChangeType = (value) => {
  const type = toUpper(value);
  if (type.includes("UPGRADE")) return "UPGRADE";
  if (type.includes("DOWNGRADE")) return "DOWNGRADE";
  return "OTHER";
};

export const mapAuditRows = (rows = []) => {
  return rows.map((row, index) => {
    const id = row?._id || row?.id || row?.logId || `audit-${index + 1}`;
    const changeType = normalizeChangeType(row?.changeType || row?.type || row?.action);
    const firstDriver = Array.isArray(row?.partnerRelation?.drivers)
      ? row.partnerRelation.drivers[0]
      : null;

    return {
      id: String(id),
      dateTimeDisplay: formatDateTime(row?.createdAt || row?.created_at || row?.updatedAt || row?.updated_at || row?.evaluatedAt || row?.timestamp),
      evaluatedAtDisplay: formatDateTime(row?.evaluatedAt || row?.evaluated_at),
      updatedAtDisplay: formatDateTime(row?.updatedAt || row?.updated_at),
      driver: pickDisplay(
        firstDriver?.firstName,
        [firstDriver?.firstName, firstDriver?.lastName].filter(Boolean).join(" "),
        row?.driverName,
        row?.driver?.name,
        row?.name
      ),
      driverPhoneNumber: pickDisplay(
        firstDriver?.phoneNumber,
        row?.partnerRelation?.account?.phoneNumber,
        row?.driver?.phoneNumber,
        row?.driver?.mobileNumber
      ),
      partnerCarType: pickDisplay(
        row?.partnerRelation?.partner?.carType,
        row?.partnerRelation?.partner?.vehicleType,
        row?.vehicleType
      ),
      partnerType: toUpper(row?.partnerType || row?.partner_type || row?.partnerRelation?.partner?.type || ""),
      changeType,
      changeTypeDisplay: changeType.replaceAll("_", " "),
      tierChange: pickDisplay(
        row?.tierChange,
        row?.change,
        (row?.previousTier || row?.evaluatedTier) ? `${row?.previousTier || "-"} → ${row?.evaluatedTier || "-"}` : "",
        (row?.fromTier || row?.toTier) ? `${row?.fromTier || "-"} → ${row?.toTier || "-"}` : ""
      ),
      tierFrom: pickDisplay(row?.previousTier, row?.fromTier),
      tierTo: pickDisplay(row?.evaluatedTier, row?.toTier),
      reason: pickDisplay(
        row?.reason?.type,
        row?.reason?.source,
        row?.reason?.tier,
        row?.reason,
        row?.remarks,
        row?.description
      ),
      triggeredBy: pickDisplay(row?.triggeredBy, row?.updatedBy, row?.actor, "System"),
      raw: row,
    };
  });
};

export const buildAuditSummary = (rows = [], serverSummary) => {
  if (serverSummary) {
    return {
      totalChanges: Number(serverSummary.totalChanges || serverSummary.total || 0),
      upgrades: Number(serverSummary.upgrades || serverSummary.upgradeCount || 0),
      downgrades: Number(serverSummary.downgrades || serverSummary.downgradeCount || 0),
      manualOverrides: Number(serverSummary.manualOverrides || serverSummary.manualOverrideCount || 0),
    };
  }

  return {
    totalChanges: rows.length,
    upgrades: rows.filter((item) => item.changeType === "UPGRADE").length,
    downgrades: rows.filter((item) => item.changeType === "DOWNGRADE").length,
    manualOverrides: rows.filter((item) => item.changeType === "MANUAL_OVERRIDE").length,
  };
};
