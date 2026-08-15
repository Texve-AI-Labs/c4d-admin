import React from "react";
import { Card, CardBody, Typography, Button } from "@material-tailwind/react";

const TABLE_HEAD = [
  "Driver",
  "Partner Type",
  "Phone Number",
  "Car Type",
  "Incentive Rule",
  "Type",
  "Amount",
  "Status",
  "Evaluated At",
  "Actions"];
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

const STATUS_CLASS = {
  CALCULATED: "bg-orange-50 text-orange-700",
  REQUESTED: "bg-blue-50 text-blue-700",
  PAID: "bg-emerald-50 text-emerald-700",
  CANCELLED: "bg-red-50 text-red-700",
};

const TYPE_CLASS = {
  WEEKLY_TIER_BONUS: "bg-slate-800 text-slate-50",
  ONLINE_HOURS_BONUS: "bg-indigo-800 text-indigo-50",
  SERVICE_TRIP_BONUS: "bg-emerald-800 text-emerald-50",
  DISPATCH_BONUS: "bg-amber-800 text-amber-50",
  TIER_BONUS: "bg-purple-800 text-purple-50",
  DEFAULT: "bg-blue-gray-800 text-blue-gray-50",
};

const getTypeClass = (value) => TYPE_CLASS[String(value || "").trim().toUpperCase()] || TYPE_CLASS.DEFAULT;

function IncentivePayoutTable({ rows, loading, pagination, onPageChange, onView }) {
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
                <th key={head} className="border-b border-blue-gray-50 py-3 px-5 text-left bg-primary">
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
                  <Typography variant="small" color="gray">Loading incentive payouts...</Typography>
                </td>
              </tr>
            )}

            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={TABLE_HEAD.length} className="px-4 py-10 text-center">
                  <Typography variant="small" color="gray">No payout records found.</Typography>
                </td>
              </tr>
            )}

            {!loading && rows.map((row, index) => {
              const cellClass = index === rows.length - 1 ? "px-4 py-3" : "border-b border-blue-gray-50 px-4 py-3";
              return (
                <tr key={row.id}>
                  <td className={cellClass}><Typography variant="small" className="font-semibold text-blue-gray-700">{safeText(row.driver)}</Typography></td>
                  <td className={cellClass}><Typography variant="small" className="text-blue-gray-700">{safeText(row.raw?.partnerType || row.partnerType)}</Typography></td>
                  <td className={cellClass}><Typography variant="small" className="text-blue-gray-700">{safeText(row.driverPhoneNumber)}</Typography></td>
                  <td className={cellClass}><Typography variant="small" className="text-blue-gray-700">{safeText(row.partnerCarType)}</Typography></td>
                  <td className={cellClass}><Typography variant="small" className="text-blue-gray-700">{safeText(row.incentiveRule)}</Typography></td>
                  <td className={cellClass}>
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold shadow-sm whitespace-nowrap ${getTypeClass(row.type)}`}>
                      {safeText(row.type)}
                    </span>
                  </td>
                  <td className={cellClass}><Typography variant="small" className="font-semibold text-blue-gray-700">{safeText(row.amountDisplay)}</Typography></td>
                  <td className={cellClass}>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_CLASS[row.status] || "bg-blue-gray-50 text-blue-gray-700"}`}>
                      {safeText(row.statusDisplay)}
                    </span>
                  </td>
                  <td className={cellClass}><Typography variant="small" className="text-blue-gray-700">{safeText(row.updatedAtDisplay)}</Typography></td>
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

        <div className="flex flex-col items-center justify-center gap-3 border-t border-blue-gray-100 px-4 py-4 text-center">
          {/* <Typography variant="small" color="gray" className="text-blue-gray-600">{`Showing ${startIndex}-${endIndex} of ${totalItems}`}</Typography> */}

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
            <Typography variant="small" className="min-w-[96px] rounded-full bg-blue-gray-100 px-3 py-2 text-center font-semibold text-blue-gray-700">{`Page ${currentPage} / ${totalPages}`}</Typography>
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

export default IncentivePayoutTable;
