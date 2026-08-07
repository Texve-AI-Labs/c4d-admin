export const STATUS_FLOW = {
  NEW: ["IN_PROGRESS"],
  IN_PROGRESS: ["FOLLOW_UP_SCHEDULED", "ACTIVE", "CANCELLED"],
  FOLLOW_UP_SCHEDULED: ["ACTIVE", "COMPLETED", "CANCELLED"],
  ACTIVE: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
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
