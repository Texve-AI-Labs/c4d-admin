import React from "react";
import { Dialog, DialogHeader, DialogBody, Typography, Button } from "@material-tailwind/react";
import moment from "moment";
import { formatReasonText } from "../AuditLogs/auditLogUtils";

const safeText = (value, fallback = "-") => {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "string") return value.trim() || fallback;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) {
    const joined = value.map((item) => safeText(item, "")).filter(Boolean).join(", ");
    return joined || fallback;
  }
  if (typeof value === "object") {
    if (typeof value.name === "string" && value.name.trim()) return value.name;
    if (typeof value.type === "string" && value.type.trim()) return value.type;
    if (typeof value.tier === "string" && value.tier.trim()) return value.tier;
    if (typeof value.source === "string" && value.source.trim()) return value.source;
    try {
      return JSON.stringify(value);

    } catch {
      return fallback;
    }
  }
  return fallback;
};


const HistoryTable = ({ history = [] }) => {
  if (!Array.isArray(history) || history.length === 0) {
    return (
      <Typography variant="small" color="gray">
        No history found.
      </Typography>
    );
  }

  return (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full min-w-[1060px] table-auto text-left">
        <thead>
          <tr>
            {[
              "Previous",
              "Evaluated",
              "Action",
              "Reason",
              "Evaluated At"].map((head) => (
                <th key={head} className="border-b border-blue-gray-100 bg-blue-gray-50 px-3 py-2 whitespace-nowrap">
                  <Typography variant="small" className="font-semibold text-blue-gray-700">{head}</Typography>
                </th>
              ))}
          </tr>
        </thead>
        <tbody>
          {history.map((row, index) => {
            const cellClass = index === history.length - 1 ? "px-3 py-2" : "border-b border-blue-gray-50 px-3 py-2";
            return (
              <tr key={`${row?.id || row?.partnerId || "history"}-${index}`}>
                <td className={`${cellClass} whitespace-nowrap`}><Typography variant="small" className="text-blue-gray-700 whitespace-nowrap">{safeText(row?.previousTier)}</Typography></td>
                <td className={`${cellClass} whitespace-nowrap`}><Typography variant="small" className="text-blue-gray-700 whitespace-nowrap">{safeText(row?.evaluatedTier)}</Typography></td>
                <td className={`${cellClass} whitespace-nowrap`}><Typography variant="small" className="text-blue-gray-700 whitespace-nowrap">{safeText(row?.action)}</Typography></td>
                <td className={`${cellClass} whitespace-nowrap`}><Typography variant="small" className="text-blue-gray-700 whitespace-nowrap">{formatReasonText(row?.reason)}</Typography></td>
                <td className={`${cellClass} whitespace-nowrap`}><Typography variant="small" className="text-blue-gray-700 whitespace-nowrap">{moment(row?.evaluatedAt).format('DD MMM YYYY, hh:mm A')}</Typography></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

const IncentiveTable = ({ rows = [] }) => {
  if (!Array.isArray(rows) || rows.length === 0) {
    return (
      <Typography variant="small" color="gray">
        No incentive records found.
      </Typography>
    );
  }

  return (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full min-w-[1240px] table-auto text-left">
        <thead>
          <tr>
            {[
              "Tier",
              "Week Start",
              "Week End",
              "Online Incentive",
              "Weekly Incentive",
              "Total Incentive",
              "Status",
              "Payout Mode",
              "Updated At",
            ].map((head) => (
              <th key={head} className="border-b border-blue-gray-100 bg-blue-gray-50 px-3 py-2 whitespace-nowrap">
                <Typography variant="small" className="font-semibold text-blue-gray-700">{head}</Typography>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => {
            const cellClass = index === rows.length - 1 ? "px-3 py-2" : "border-b border-blue-gray-50 px-3 py-2";
            return (
              <tr key={`${row?.id || row?.partnerId || "incentive"}-${index}`}>
                <td className={`${cellClass} whitespace-nowrap`}><Typography variant="small" className="text-blue-gray-700 whitespace-nowrap">{safeText(row?.tier)}</Typography></td>
                <td className={`${cellClass} whitespace-nowrap`}><Typography variant="small" className="text-blue-gray-700 whitespace-nowrap">{moment(row?.weekStart).format('DD MMM YYYY, hh:mm A')}</Typography></td>
                <td className={`${cellClass} whitespace-nowrap`}><Typography variant="small" className="text-blue-gray-700 whitespace-nowrap">{moment(row?.weekEnd).format('DD MMM YYYY, hh:mm A')}</Typography></td>
                <td className={`${cellClass} whitespace-nowrap`}><Typography variant="small" className="text-blue-gray-700 whitespace-nowrap">{safeText(row?.onlineIncentive)}</Typography></td>
                <td className={`${cellClass} whitespace-nowrap`}><Typography variant="small" className="text-blue-gray-700 whitespace-nowrap">{safeText(row?.weeklyIncentive)}</Typography></td>
                <td className={`${cellClass} whitespace-nowrap`}><Typography variant="small" className="font-semibold text-blue-gray-700 whitespace-nowrap">{safeText(row?.totalIncentive)}</Typography></td>
                <td className={`${cellClass} whitespace-nowrap`}><Typography variant="small" className="text-blue-gray-700 whitespace-nowrap">{safeText(row?.status)}</Typography></td>
                <td className={`${cellClass} whitespace-nowrap`}><Typography variant="small" className="text-blue-gray-700 whitespace-nowrap">{safeText(row?.payoutMode)}</Typography></td>
                <td className={`${cellClass} whitespace-nowrap`}><Typography variant="small" className="text-blue-gray-700 whitespace-nowrap">{moment(row?.updated_at || row?.updatedAt).format('DD MMM YYYY, hh:mm A')}</Typography></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

const AuditTable = ({ rows = [] }) => {
  if (!Array.isArray(rows) || rows.length === 0) {
    return (
      <Typography variant="small" color="gray">
        No audit records found.
      </Typography>
    );
  }

  return (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full min-w-[1160px] table-auto text-left">
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
          {rows.map((row, index) => {
            const cellClass = index === rows.length - 1 ? "px-3 py-2" : "border-b border-blue-gray-50 px-3 py-2";
            return (
              <tr key={`${row?.id || row?.partnerId || "audit"}-${index}`}>

                <td className={`${cellClass} whitespace-nowrap`}><Typography variant="small" className="text-blue-gray-700 whitespace-nowrap">{safeText(row?.previousTier)}</Typography></td>
                <td className={`${cellClass} whitespace-nowrap`}><Typography variant="small" className="text-blue-gray-700 whitespace-nowrap">{safeText(row?.evaluatedTier)}</Typography></td>
                <td className={`${cellClass} whitespace-nowrap`}><Typography variant="small" className="text-blue-gray-700 whitespace-nowrap">{safeText(row?.action)}</Typography></td>
                <td className={`${cellClass} whitespace-nowrap`}><Typography variant="small" className="text-blue-gray-700 whitespace-nowrap">{formatReasonText(row?.reason)}</Typography></td>
                <td className={`${cellClass} whitespace-nowrap`}><Typography variant="small" className="text-blue-gray-700 whitespace-nowrap">{moment(row?.evaluatedAt).format('DD MMM YYYY, hh:mm A')}</Typography></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

function ActionViewModal({
  open,
  title = "Details",
  loading = false,
  error = "",
  payload = null,
  onClose,
}) {
  const hasMonitoringHistoryView = title === "Partner History" && payload?.selectedRow && Array.isArray(payload?.history);
  const hasIncentiveView = title === "Incentive Details" && payload?.selectedRow;
  const hasAuditView = title === "Audit Details";
  const incentiveRows = Array.isArray(payload?.fetchedList) && payload.fetchedList.length > 0
    ? payload.fetchedList
    : [payload?.fetchedRecord || payload?.selectedRow].filter(Boolean);
  const auditRows = Array.isArray(payload?.relatedHistory) ? payload.relatedHistory : [];
  return (
    <Dialog open={open} handler={onClose} size="lg">
      <DialogHeader className="flex items-center justify-between">
        <Typography variant="h6" color="blue-gray">{title}</Typography>
        <Button size="sm" variant="text" color="blue-gray" className="normal-case" onClick={onClose}>
          Close
        </Button>
      </DialogHeader>
      <DialogBody divider className="max-h-[70vh] overflow-auto">
        {loading && (
          <Typography variant="small" color="gray">
            Loading details...
          </Typography>
        )}
        {!loading && error && (
          <Typography variant="small" color="red">
            {error}
          </Typography>
        )}
        {!loading && !error && (
          <>
            {hasMonitoringHistoryView ? (
              <div className="space-y-3">
                <HistoryTable history={payload?.history || []} />
              </div>
            ) : hasIncentiveView ? (
              <div className="space-y-3">
                <IncentiveTable rows={incentiveRows} />
              </div>
            ) : hasAuditView ? (
              <div className="space-y-3">
                <AuditTable rows={auditRows} />
              </div>
            ) : (
              <pre className="whitespace-pre-wrap break-words text-xs text-blue-gray-800">
                {JSON.stringify(payload || {}, null, 2)}
              </pre>
            )}
          </>
        )}
      </DialogBody>
    </Dialog>
  );
}

export default ActionViewModal;
