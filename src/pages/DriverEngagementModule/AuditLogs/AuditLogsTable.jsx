import React from "react";
import { Card, CardBody, Typography, Button } from "@material-tailwind/react";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import { formatReasonText } from "./auditLogUtils";

const TABLE_HEAD = ["Date & Time", "Driver", "Partner Type", "Phone Number", "Car Type", "Change Type", "Tier Change",  "Updated At", "Actions"];
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

const CHANGE_TYPE_CLASS = {
  UPGRADE: "bg-amber-800 text-amber-50",
  DOWNGRADE: "bg-slate-800 text-slate-50",
  OTHER: "bg-blue-gray-800 text-blue-gray-50",
};

const TIER_CLASS = {
  SILVER: "bg-slate-700 text-slate-50",
  GOLD: "bg-amber-700 text-amber-50",
  ELITE: "bg-emerald-800 text-emerald-50",
  DEFAULT: "bg-blue-gray-800 text-blue-gray-50",
};

const getTierClass = (value) => TIER_CLASS[String(value || "").trim().toUpperCase()] || TIER_CLASS.DEFAULT;

function AuditLogsTable({
  rows,
  loading,
  pagination,
  onPageChange,
  onView,
  expandedRowId,
  expandedRowPayload,
  expandedRowLoading,
  expandedRowError,
}) {
  const {
    currentPage = 1,
    totalPages = 1,
    totalItems = 0,
    itemsPerPage = rows.length || 10,
  } = pagination || {};

  const startIndex = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, totalItems);

  const renderExpandedContent = (payload, isLoading, error) => {
    if (isLoading) {
      return <Typography variant="small" color="gray">Loading details...</Typography>;
    }
    if (error) {
      return <Typography variant="small" color="red">{error}</Typography>;
    }

    const history = Array.isArray(payload?.relatedHistory) ? payload.relatedHistory : [];
    if (history.length === 0) {
      return <Typography variant="small" color="gray">No audit details found.</Typography>;
    }

    return (
      <div className="overflow-x-auto rounded-lg border border-blue-gray-100 bg-white">
        <table className="w-full min-w-[920px] table-auto text-left">
          <thead>
            <tr>
              {["Previous", "Evaluated", "Action", "Reason", "Evaluated At"].map((head) => (
                <th key={head} className="border-b border-blue-gray-100 bg-blue-gray-50 px-3 py-2 whitespace-nowrap">
                  <Typography variant="small" className="font-semibold text-blue-gray-700">{head}</Typography>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {history.map((item, index) => (
              <tr key={`${item?.id || item?.partnerId || "audit"}-${index}`}>
                <td className="border-b border-blue-gray-50 px-3 py-2 whitespace-nowrap"><Typography variant="small" className="text-blue-gray-700 whitespace-nowrap">{safeText(item?.previousTier)}</Typography></td>
                <td className="border-b border-blue-gray-50 px-3 py-2 whitespace-nowrap"><Typography variant="small" className="text-blue-gray-700 whitespace-nowrap">{safeText(item?.evaluatedTier)}</Typography></td>
                <td className="border-b border-blue-gray-50 px-3 py-2 whitespace-nowrap"><Typography variant="small" className="text-blue-gray-700 whitespace-nowrap">{safeText(item?.action)}</Typography></td>
                <td className="border-b border-blue-gray-50 px-3 py-2 whitespace-nowrap"><Typography variant="small" className="text-blue-gray-700 whitespace-nowrap">{formatReasonText(item?.reason)}</Typography></td>
                <td className="border-b border-blue-gray-50 px-3 py-2 whitespace-nowrap"><Typography variant="small" className="text-blue-gray-700 whitespace-nowrap">{safeText(item?.evaluatedAt)}</Typography></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <Card className="border border-blue-gray-100 shadow-none">
      <CardBody className="overflow-x-auto px-0 py-0">
        <table className="w-full min-w-[980px] table-auto text-left">
          <thead>
            <tr>
              {TABLE_HEAD.map((head) => (
                <th key={head} className="border-b border-blue-gray-50 py-3 px-5 text-left bg-primary whitespace-nowrap">
                  <Typography variant="small" className="font-semibold text-white">{head}</Typography>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {loading && (
              <tr>
                <td colSpan={TABLE_HEAD.length} className="px-4 py-10 text-center">
                  <Typography variant="small" color="gray">Loading audit logs...</Typography>
                </td>
              </tr>
            )}

            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={TABLE_HEAD.length} className="px-4 py-10 text-center">
                  <Typography variant="small" color="gray">No audit logs found.</Typography>
                </td>
              </tr>
            )}

            {!loading && rows.map((row, index) => {
              const cellClass = index === rows.length - 1 ? "px-4 py-3" : "border-b border-blue-gray-50 px-4 py-3";
              const isExpanded = row.id === expandedRowId;

              return (
                <React.Fragment key={row.id}>
                <tr>
                  <td className={`${cellClass} whitespace-nowrap`}><Typography variant="small" className="text-blue-gray-700 whitespace-nowrap">{safeText(row.dateTimeDisplay)}</Typography></td>
                  <td className={`${cellClass} whitespace-nowrap`}><Typography variant="small" className="font-semibold text-blue-gray-700 whitespace-nowrap">{safeText(row.driver)}</Typography></td>
                  <td className={`${cellClass} whitespace-nowrap`}><Typography variant="small" className="text-blue-gray-700 whitespace-nowrap">{safeText(row.partnerType)}</Typography></td>
                  <td className={`${cellClass} whitespace-nowrap`}><Typography variant="small" className="text-blue-gray-700 whitespace-nowrap">{safeText(row.driverPhoneNumber)}</Typography></td>
                  <td className={`${cellClass} whitespace-nowrap`}><Typography variant="small" className="text-blue-gray-700 whitespace-nowrap">{safeText(row.partnerCarType)}</Typography></td>
                  <td className={cellClass}>
                    <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${CHANGE_TYPE_CLASS[row.changeType] || CHANGE_TYPE_CLASS.OTHER}`}>
                      {safeText(row.changeTypeDisplay)}
                    </span>
                  </td>
                  <td className={cellClass}>
                    {((row?.tierFrom && row?.tierFrom !== "-") || (row?.tierTo && row?.tierTo !== "-")) ? (
                      <div className="flex items-center gap-1 whitespace-nowrap text-blue-gray-700">
                        {row?.tierFrom && row?.tierFrom !== "-" ? (
                          <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${getTierClass(row.tierFrom)}`}>{safeText(row.tierFrom)}</span>
                        ) : null}
                        <ArrowRightIcon className="h-4 w-4 text-blue-gray-500" />
                        <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${getTierClass(row.tierTo)}`}>{safeText(row.tierTo || "-")}</span>
                      </div>
                    ) : (
                      <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${getTierClass(row.tierTo || row.tierFrom)}`}>
                        {safeText(row.tierChange)}
                      </span>
                    )}
                  </td>
                  <td className={`${cellClass} whitespace-nowrap`}><Typography variant="small" className="text-blue-gray-700 whitespace-nowrap">{safeText(row.updatedAtDisplay)}</Typography></td>
                  <td className={`${cellClass} whitespace-nowrap`}>
                    <Button
                      size="sm"
                      variant="text"
                      color="blue"
                      className="px-0 py-0 normal-case"
                      onClick={() => onView?.(row)}
                    >
                      {isExpanded ? "Hide" : "View"}
                    </Button>
                  </td>
                </tr>
                {isExpanded && (
                  <tr>
                    <td colSpan={TABLE_HEAD.length} className="bg-blue-gray-50 px-4 py-4">
                      <div className="space-y-3 rounded-lg border border-blue-gray-100 bg-white p-4">
                        <Typography variant="small" className="font-semibold text-blue-gray-700">
                          Audit Details
                        </Typography>
                        {renderExpandedContent(expandedRowPayload, expandedRowLoading, expandedRowError)}
                      </div>
                    </td>
                  </tr>
                )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>

        <div className="flex flex-col items-center justify-center gap-3 border-t border-blue-gray-100  px-4 py-4 text-center">
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

export default AuditLogsTable;
