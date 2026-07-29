export const safeText = (value, fallback = "-") => {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "string") return value.trim() || fallback;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) {
    const joined = value.map((item) => safeText(item, "")).filter(Boolean).join(", ");
    return joined || fallback;
  }
  if (typeof value === "object") {
    if (typeof value.name === "string" && value.name.trim()) return value.name;
    if (typeof value.label === "string" && value.label.trim()) return value.label;
    if (typeof value.title === "string" && value.title.trim()) return value.title;
    if (typeof value.type === "string" && value.type.trim()) return value.type;
    if (typeof value.message === "string" && value.message.trim()) return value.message;
    try {
      return JSON.stringify(value);
    } catch {
      return fallback;
    }
  }
  return fallback;
};