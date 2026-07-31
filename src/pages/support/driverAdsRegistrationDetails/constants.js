export const STATUS_FLOW = {
  NEW: ["IN_PROGRESS"],
  IN_PROGRESS: ["FOLLOW_UP_SCHEDULED"],
  FOLLOW_UP_SCHEDULED: ["COMPLETED"],
  COMPLETED: [],
};

export const STATUS_LABELS = {
  NEW: "New",
  IN_PROGRESS: "In Progress",
  FOLLOW_UP_SCHEDULED: "Follow Up Scheduled",
  COMPLETED: "Completed",
};

export const ACTIVITY_TABS = [
  { key: "notes", label: "Notes" },
  { key: "followUps", label: "Follow Ups" },
  { key: "history", label: "History" },
  { key: "timeline", label: "Timeline" },
];
