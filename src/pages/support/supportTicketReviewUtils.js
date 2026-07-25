import moment from "moment";

export const STATUS_OPTIONS = ["OPEN", "UNDER_REVIEW", "APPROVED", "REJECTED", "RESOLVED"];

export const STATUS_FLOW = {
  OPEN: ["UNDER_REVIEW"],
  UNDER_REVIEW: ["APPROVED", "REJECTED"],
  APPROVED: ["REJECTED"],
  REJECTED: [],
  RESOLVED: [],
};

export const formatDateTime = (value) => {
  if (!value) return "-";
  const parsed = moment(value);
  if (!parsed.isValid()) return String(value);
  return parsed.format("DD-MM-YYYY hh:mm A");
};

export const formatBadgeText = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

export const formatCurrency = (value) => {
  if (value === null || value === undefined || value === "") return "-";
  const num = Number(value);
  if (Number.isNaN(num)) return String(value);
  return `₹ ${num.toFixed(2)}`;
};

export const getStatusTone = (value) => {
  const normalized = String(value || "").toUpperCase();
  if (normalized === "APPROVED") return "bg-green-500 text-white border-emerald-600";
  if (normalized === "REJECTED") return "bg-red-500 text-white border-rose-600";
  if (normalized === "RESOLVED") return "bg-gray-500 text-white border-sky-600";
  if (normalized === "OPEN") return "bg-amber-500 text-white border-amber-500";
  return "bg-blue-500 text-white border-slate-700";
};

export const getAllowedStatusOptions = (currentStatus) => {
  const normalized = String(currentStatus || "").toUpperCase();
  if (!normalized) return STATUS_OPTIONS;
  return [normalized, ...(STATUS_FLOW[normalized] || [])];
};

export const isTerminalStatus = (value) => ["APPROVED", "REJECTED", "RESOLVED"].includes(String(value || "").toUpperCase());

export const buildRoute = (route, id) =>
  route
    .replace(":id", encodeURIComponent(id))
    .replace(":ticketId", encodeURIComponent(id));

export const normalizeRows = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.history)) return payload.history;
  if (payload && typeof payload === "object") return [payload];
  return [];
};

export const isPdfFile = (src = "") =>
  String(src).toLowerCase().includes(".pdf") || String(src).toLowerCase().startsWith("data:application/pdf");

export const shouldShowReviewFields = (ticketStatus, selectedStatus) => {
  const normalizedTicketStatus = String(ticketStatus || "").toUpperCase();
  const normalizedSelectedStatus = String(selectedStatus || "").toUpperCase();
  const activeStatus = normalizedSelectedStatus || normalizedTicketStatus;
  const isRejected = activeStatus === "REJECTED";
  return {
    isRejected,
    showReviewFields: activeStatus === "APPROVED",
    showAdminRemarks: ["UNDER_REVIEW", "APPROVED", "REJECTED"].includes(activeStatus),
  };
};

export const getTicketReviewValidationRules = (selectedStatus) => {
  const normalizedStatus = String(selectedStatus || "").toUpperCase();
  if (normalizedStatus === "APPROVED") {
    return {
      rewardAmount: "Reward amount is required and must be zero or greater.",
      rewardReason: "Reward reason is required.",
      adminRemarks: "Admin remarks is required.",
    };
  }

  if (normalizedStatus === "REJECTED") {
    return {
      adminRemarks: "Admin remarks is required.",
    };
  }

  return {};
};

export const validateTicketReview = ({ selectedStatus, rewardAmount, rewardReason, adminRemarks }) => {
  const rules = getTicketReviewValidationRules(selectedStatus);
  const nextErrors = {};
  const normalizedStatus = String(selectedStatus || "").toUpperCase();

  if (rules.rewardAmount) {
    const parsedAmount = Number(rewardAmount);
    if (rewardAmount === "" || Number.isNaN(parsedAmount) || parsedAmount < 0) {
      nextErrors.rewardAmount = rules.rewardAmount;
    }
  }

  if (rules.rewardReason && String(rewardReason || "").trim() === "") {
    nextErrors.rewardReason = rules.rewardReason;
  }

  if (rules.adminRemarks && String(adminRemarks || "").trim() === "") {
    nextErrors.adminRemarks = rules.adminRemarks;
  }

  return {
    valid: Object.keys(nextErrors).length === 0,
    errors: nextErrors,
    normalizedStatus,
  };
};
