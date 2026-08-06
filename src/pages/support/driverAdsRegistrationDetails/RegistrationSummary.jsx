import React from "react";
import { Typography } from "@material-tailwind/react";

export default function RegistrationSummary({
  completedCycles,
  totalCycles,
  currentCycleNumber,
  progressPercent,
  claimableCycleNumber,
  registration,
  summaryCards,
}) {
  return (
    <div className="rounded-xl border border-blue-gray-100 bg-white p-4">
      <Typography variant="small" className="mb-3 font-medium text-blue-gray-700">
        Registration Summary
      </Typography>
      <div className="mb-4 rounded-xl border border-blue-gray-100 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Typography variant="small" className="font-medium text-blue-gray-600">
              Cycle Progress
            </Typography>
            <Typography className="text-lg font-bold text-blue-gray-900">
              {completedCycles}/{totalCycles || "-"} completed
            </Typography>
          </div>
          <div className="text-right">
            <Typography variant="small" className="font-medium text-blue-gray-600">
              Current Cycle
            </Typography>
            <Typography className="text-lg font-bold text-blue-gray-900">{currentCycleNumber || "-"}</Typography>
          </div>
        </div>
        <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-200">
          <div className="h-full rounded-full bg-green-600 transition-all duration-300" style={{ width: `${progressPercent}%` }} />
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs font-semibold text-blue-gray-600">
          <span>{progressPercent}% complete</span>
          <span>Claimable cycle: {claimableCycleNumber ?? "-"}</span>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">{summaryCards}</div>
    </div>
  );
}
