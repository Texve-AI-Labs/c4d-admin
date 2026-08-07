import { STATUS_LABELS } from "./constants";

export const formatStatusLabel = (value) => {
  if (!value) return "-";
  const normalized = String(value).toUpperCase();
  if (STATUS_LABELS[normalized]) return STATUS_LABELS[normalized];
  return String(value)
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export const getStatusBadgeClass = (value) => {
  const normalized = String(value || "").toUpperCase();
  if (normalized === "NEW") return "bg-blue-gray-100 text-blue-gray-800 border-blue-gray-200";
  if (normalized === "IN_PROGRESS") return "bg-blue-50 text-blue-700 border-blue-200";
  if (normalized === "FOLLOW_UP_SCHEDULED") return "bg-orange-50 text-orange-700 border-orange-200";
  if (normalized === "ACTIVE") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (normalized === "COMPLETED") return "bg-green-50 text-green-700 border-green-200";
  if (normalized === "CANCELLED") return "bg-red-50 text-red-700 border-red-200";
  return "bg-blue-gray-50 text-blue-gray-700 border-blue-gray-200";
};

export const getStatusOptions = (status, statusFlow) =>
  [status, ...(statusFlow[status] || [])].filter((value, index, array) => array.indexOf(value) === index);
