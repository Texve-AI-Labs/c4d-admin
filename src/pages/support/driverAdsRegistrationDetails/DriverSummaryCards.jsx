import React from "react";
import { Button, Typography } from "@material-tailwind/react";
import { formatStatusLabel, getStatusBadgeClass } from "./utils";

export default function DriverSummaryCards({ driver, status, advertisement, onStatusUpdate }) {
  const timeSlots = Array.isArray(advertisement?.config?.timeSlots) ? advertisement.config.timeSlots : [];
  const firstTimeSlot = timeSlots[0] || {};
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {[
        ["First Name", driver?.firstName],
        ["Phone Number", driver?.phoneNumber],
        ["Service Type", driver?.serviceType],
        ["Status", formatStatusLabel(status)],
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
          From - To
        </Typography>
        <span className="inline-flex items-center rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700">
          {firstTimeSlot?.from || "--"} - {firstTimeSlot?.to || "--"}
        </span>
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
