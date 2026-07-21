export const ENTITY_TYPE_OPTIONS = [
  { label: "All", value: "" },
  { label: "Cab", value: "CAB" },
  { label: "Auto", value: "AUTO" },
  { label: "Bike", value: "BIKE" },
  { label: "Parcel", value: "PARCEL" },
  { label: "Driver", value: "DRIVER" },
];

export const badgeClassByValue = (value) => {
  const normalized = String(value || "").toUpperCase();
  if (normalized === "IN_PROGRESS") return "bg-amber-100 text-amber-800 border-amber-200";
  if (normalized === "PAID") return "bg-green-100 text-green-700 border-green-200";
  if (normalized === "REJECTED") return "bg-red-100 text-red-700 border-red-200";
  if (normalized === "SILVER") return "bg-slate-100 text-slate-700 border-slate-200";
  if (normalized === "GOLD") return "bg-amber-100 text-amber-700 border-amber-200";
  if (normalized === "ELITE") return "bg-violet-100 text-violet-700 border-violet-200";
  if (normalized === "YES" || normalized === "ELIGIBLE") return "bg-emerald-100 text-emerald-700 border-emerald-200";
  if (normalized === "NO" || normalized === "NOT ELIGIBLE") return "bg-red-100 text-red-700 border-red-200";
  return "bg-gray-100 text-gray-700 border-gray-200";
};

export const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

export const formatCurrency = (value) => {
  if (value === null || value === undefined || value === "") return "-";
  const amount = Number(value);
  if (Number.isNaN(amount)) return String(value);
  return `₹ ${amount.toFixed(2)}`;
};

export const normalizeRows = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.data?.items)) return payload.data.items;
  if (Array.isArray(payload?.result?.items)) return payload.result.items;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.result)) return payload.result;
  return [];
};

export const formatProcessedBy = (value) => {
  if (!value) return "-";
  if (typeof value === "string" || typeof value === "number") return String(value);
  return value?.name || value?.fullName || value?.userName || value?.processedByName || value?.email || value?.phoneNumber || value?.id || "-";
};

// export const getProcessedByTone = (value) => {
//   const normalized = String(value || "").toUpperCase();
//   if (normalized.includes("SUPER_USER")) return "bg-rose-500 text-black border-rose-500";
//   if (normalized.includes("ADMIN")) return "bg-sky-500 text-white border-sky-500";
//   if (normalized.includes("SUPPORT")) return "bg-emerald-500 text-white border-emerald-500";
//   if (normalized.includes("FINANCE")) return "bg-amber-500 text-white border-amber-500";
//   return "bg-blue-500 text-white border-black-500";
// };

// export const getProcessedByRole = (value) => {
//   if (!value) return "";
//   if (typeof value === "string") return value;
//   if (typeof value !== "object") return "";
//   return value?.role || value?.userRole || value?.type || value?.accountType || "";
// };