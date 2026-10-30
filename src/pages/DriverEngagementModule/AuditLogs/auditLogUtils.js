const safeString = (value) => (typeof value === "string" ? value.trim() : "");

export const formatReasonText = (reason) => {
  if (reason && typeof reason === "object") {
    const preferred =
      reason.reason ||
      reason.message ||
      reason.description ||
      reason.source ||
      reason.type ||
      reason.code;

    if (typeof preferred === "string" && preferred.trim()) return preferred.trim();

    if (reason.source && typeof reason.source === "object") {
      const nestedSource =
        reason.source.reason ||
        reason.source.message ||
        reason.source.description ||
        reason.source.type ||
        reason.source.code;
      if (typeof nestedSource === "string" && nestedSource.trim()) return nestedSource.trim();
    }

    if (Object.keys(reason).length === 1 && typeof reason.source === "string") {
      return reason.source.trim() || "-";
    }
  }

  const fallback = safeString(reason);
  return fallback || "-";
};
