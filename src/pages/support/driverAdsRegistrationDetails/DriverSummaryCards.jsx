import React from "react";
import { Button, Typography } from "@material-tailwind/react";
import { formatStatusLabel, getStatusBadgeClass } from "./utils";

export default function DriverSummaryCards({ driver, status, advertisement, registration, onStatusUpdate }) {
  const placements = Array.isArray(registration?.selectedPlacements) ? registration.selectedPlacements : [];
  const firstPlacement = placements[0] || {};
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {[
        ["First Name", driver?.firstName],
        ["Phone Number", driver?.phoneNumber],
        ["Service Type", driver?.serviceType],
        ["Status", formatStatusLabel(status)],
        ["Advertisement", advertisement?.name],
        ["Contract Period", advertisement?.contractPeriod ? `${advertisement.contractPeriod} days` : "-"],
      ].map(([label, value]) => (
        <div key={label} className="rounded-xl border border-blue-gray-100 bg-white p-4">
          <Typography variant="small" className="mb-1 font-medium text-blue-gray-700">
            {label}
          </Typography>
          {label === "Status" ? (
            <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${getStatusBadgeClass(status)}`}>
              {value ?? "-"}
            </span>
          ) : (
            <Typography className="text-sm font-semibold text-black">{value ?? "-"}</Typography>
          )}
        </div>
      ))}
      <div className="rounded-xl border border-blue-gray-100 bg-white p-4">
        <Typography variant="small" className="mb-1 font-medium text-blue-gray-700">
          Selected Placement
        </Typography>
        <Typography className="text-sm font-semibold text-black">{firstPlacement?.place || "-"}</Typography>
        <Typography className="text-xs text-blue-gray-600">
          {firstPlacement?.slot?.from || "--"} - {firstPlacement?.slot?.to || "--"}
        </Typography>
      </div>
      <div className="rounded-xl border border-blue-gray-100 bg-white p-4">
        <Typography variant="small" className="mb-1 font-medium text-blue-gray-700">
          Action
        </Typography>
        <Button className="bg-primary text-white" onClick={onStatusUpdate}>
          Status Update
        </Button>
      </div>
    </div>
  );
}
