import React from "react";
import { Chip } from "@material-tailwind/react";

const colorByStatus = {
  VERIFIED: "green",
  APPROVED: "green",
  COMPLETED: "green",
  PENDING: "amber",
  REJECTED: "red",
};

export default function OnboardingStatusBadge({ value }) {
  const label = String(value || "PENDING").toUpperCase();
  const color = colorByStatus[label] || "blue-gray";

  return <Chip size="sm" value={label} color={color} className="w-fit" />;
}
