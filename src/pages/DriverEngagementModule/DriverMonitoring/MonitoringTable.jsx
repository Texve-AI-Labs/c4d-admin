import React from "react";
import { Card, CardBody, Typography, Button } from "@material-tailwind/react";

const TABLE_HEAD = [
  "Driver",
  "Tier",
  "Vehicle",
  "Zone",
  "Daily Hours",
  "Weekly AR",
  "Rating",
  "last Evaluate dAt",
  "Actions",
];
const safeText = (value, fallback = "-") => {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "string") return value.trim() || fallback;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (typeof value === "object") {
    if (typeof value.type === "string" && value.type.trim()) return value.type;
    if (typeof value.tier === "string" && value.tier.trim()) return value.tier;
    try {
      return JSON.stringify(value);
    } catch {
      return fallback;
    }
  }
  return fallback;
};

const getBadgeClasses = (value, kind) => {
  const normalized = safeText(value).toUpperCase();
  const base =
    "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold tracking-wide shadow-sm whitespace-nowrap";

  if (kind === "tier") {
    if (normalized === "SILVER") return `${base} bg-slate-700 text-slate-50`;
    if (normalized === "GOLD") return `${base} bg-amber-700 text-amber-50`;
    if (normalized === "ELITE") return `${base} bg-emerald-800 text-emerald-50`;
    return `${base} bg-blue-gray-700 text-blue-gray-50`;
  }

  if (kind === "vehicle") {
    if (normalized.includes("BIKE")) return `${base} bg-indigo-700 text-indigo-50`;
    if (normalized.includes("AUTO")) return `${base} bg-orange-800 text-orange-50`;
    if (normalized.includes("PARCEL")) return `${base} bg-teal-800 text-teal-50`;
    if (normalized.includes("DRIVER")) return `${base} bg-cyan-800 text-cyan-50`;
    return `${base} bg-blue-gray-700 text-blue-gray-50`;
  }

  return `${base} bg-blue-gray-700 text-blue-gray-50`;
};

function MonitoringTable({ rows, loading, pagination, onPageChange, onView }) {
  const {
    currentPage = 1,
    totalPages = 1,
    totalItems = 0,
    itemsPerPage = rows.length || 10,
  } = pagination || {};

  const startIndex = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <Card className="border border-blue-gray-100 shadow-none">
      <CardBody className="overflow-x-auto px-0 py-0">
        <table className="w-full min-w-[980px] table-auto text-left">
          <thead>
            <tr>
              {TABLE_HEAD.map((head) => (
                <th key={head} className="border-b border-blue-gray-50 py-3 px-5 text-left bg-primary whitespace-nowrap">
                  <Typography variant="small" className="font-semibold text-white">
                    {head}
                  </Typography>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={TABLE_HEAD.length} className="px-4 py-10 text-center">
                  <Typography variant="small" color="gray">Loading driver monitoring data...</Typography>
                </td>
              </tr>
            )}

            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={TABLE_HEAD.length} className="px-4 py-10 text-center">
                  <Typography variant="small" color="gray">No drivers found for selected filters.</Typography>
                </td>
              </tr>
            )}

            {!loading &&
              rows.map((row, index) => {
                const cellClass =
                  index === rows.length - 1
                    ? "px-4 py-3"
                    : "border-b border-blue-gray-50 px-4 py-3 whitespace-nowrap";

                return (
                  <tr key={row.id}>
                    <td className={cellClass}><Typography variant="small" className="font-semibold text-blue-gray-700">{safeText(row.driver) || (row.partnerName)}</Typography></td>
                    <td className={cellClass}>
                      <span className={getBadgeClasses(row.tier, "tier")}>{safeText(row.tier)}</span>
                    </td>
                    <td className={cellClass}>
                      <span className={getBadgeClasses(row.vehicle, "vehicle")}>{safeText(row.vehicle)}</span>
                    </td>
                    <td className={cellClass}><Typography variant="small" className="text-blue-gray-700">{safeText(row.zone)}</Typography></td>
                    <td className={cellClass}><Typography variant="small" className="text-blue-gray-700">{safeText(row.dailyHoursDisplay)}</Typography></td>
                    <td className={cellClass}><Typography variant="small" className="text-blue-gray-700">{safeText(row.weeklyARDisplay)}</Typography></td>
                    <td className={cellClass}><Typography variant="small" className="text-blue-gray-700">{safeText(row.ratingDisplay)}</Typography></td>
                    <td className={cellClass}><Typography variant="small" className="text-blue-gray-700">{safeText(row.evaluatedAtDisplay)}</Typography></td>
                    <td className={cellClass}>
                      <Button
                        size="sm"
                        variant="text"
                        color="blue"
                        className="px-0 py-0 normal-case"
                        onClick={() => onView?.(row)}
                      >
                        View
                      </Button>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>

        <div className="flex flex-col items-center justify-center gap-3 border-t px-4 py-4 text-center">
          {/* <Typography variant="small" color="gray" className="text-blue-gray-600">
            {`Showing ${startIndex}-${endIndex} of ${totalItems}`}
          </Typography> */}

          <div className="flex flex-wrap items-center justify-center gap-2 rounded-full bg-white px-3 py-2 shadow-sm">
            <Button
              size="sm"
              variant="filled"
              color="blue"
              disabled={currentPage <= 1 || loading}
              onClick={() => onPageChange(currentPage - 1)}
              className="normal-case shadow-none"
            >
              Previous
            </Button>
            <Typography
              variant="small"
              className="min-w-[96px] rounded-full bg-blue-gray-100 px-3 py-2 text-center font-semibold text-blue-gray-700"
            >
              {`Page ${currentPage} / ${totalPages}`}
            </Typography>
            <Button
              size="sm"
              variant="filled"
              color="blue"
              disabled={currentPage >= totalPages || loading}
              onClick={() => onPageChange(currentPage + 1)}
              className="normal-case shadow-none"
            >
              Next
            </Button>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

export default MonitoringTable;
