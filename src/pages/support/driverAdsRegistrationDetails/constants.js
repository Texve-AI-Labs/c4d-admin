export const STATUS_FLOW = {
  NEW: ["IN_PROGRESS"],
  IN_PROGRESS: ["FOLLOW_UP_SCHEDULED"],
  FOLLOW_UP_SCHEDULED: ["ACTIVE", "CANCELLED"],
  ACTIVE: [],
  COMPLETED: [],
  CANCELLED: [],
};

export const CYCLE_STATUS_FLOW = {
  CLAIM_SUBMITTED: ["UNDER_REVIEW"],
  UNDER_REVIEW: ["APPROVED", "REJECTED"],
  APPROVED: ["PAID"],
  REJECTED: [],
  PAID: ["COMPLETED"],
  COMPLETED: [],
};

export const STATUS_LABELS = {
  NEW: "New",
  IN_PROGRESS: "In Progress",
  FOLLOW_UP_SCHEDULED: "Follow Up Scheduled",
  ACTIVE: "Active",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export const ACTIVITY_TABS = [
  { key: "notes", label: "Notes" },
  { key: "followUps", label: "Follow Ups" },
  { key: "history", label: "History" },
  { key: "timeline", label: "Timeline" },
];
