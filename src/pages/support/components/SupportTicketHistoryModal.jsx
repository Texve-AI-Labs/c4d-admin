import React, { useEffect, useState } from "react";
import { Button, Dialog, DialogBody, DialogHeader, Typography } from "@material-tailwind/react";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { API_ROUTES } from "@/utils/constants";
import { buildRoute, formatBadgeText, formatDateTime, getStatusTone, normalizeRows } from "../supportTicketReviewUtils";

function SupportTicketHistoryModal({ open, onClose, ticketId, fallbackTicket, onOpenProof }) {
  const [ticketDetails, setTicketDetails] = useState(null);
  const [historyRows, setHistoryRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const ticket = ticketDetails || fallbackTicket || null;
  const sortedHistoryRows = [...historyRows].sort((a, b) => {
    const left = Number(a?.ticketIndex ?? 0);
    const right = Number(b?.ticketIndex ?? 0);
    if (Number.isNaN(left) || Number.isNaN(right)) return 0;
    return right - left;
  });

  useEffect(() => {
    const fetchHistory = async () => {
      if (!open || !ticketId) {
        setTicketDetails(null);
        setHistoryRows([]);
        return;
      }

      try {
        setLoading(true);
        const response = await ApiRequestUtils.get(buildRoute(API_ROUTES.SUPPORT_TICKET_BY_ID, ticketId));
        const detail = response?.data || response || null;
        setTicketDetails(detail);
        setHistoryRows(
          normalizeRows(
            detail?.historyEntries ||
              detail?.history ||
              response?.historyEntries ||
              response?.history ||
              response?.data?.historyEntries ||
              response?.data?.history
          )
        );
      } catch (err) {
        console.error("Failed to fetch ticket by id:", err);
        setTicketDetails(fallbackTicket || null);
        setHistoryRows([]);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [open, ticketId, fallbackTicket]);

  return (
    <Dialog
      open={open}
      handler={onClose}
      size="xl"
      className="max-h-[90vh] overflow-y-auto"
      dismiss={{ outsidePress: false, escapeKey: false }}
    >
      <DialogHeader className="flex items-center justify-between">
        <span className="text-lg">Ticket History</span>
        <Button
          size="sm"
          variant="outlined"
          onClick={onClose}
          className="rounded-full border-black px-4 py-2 text-xs font-semibold text-black"
        >
          Close
        </Button>
      </DialogHeader>
      <DialogBody className="space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-4 py-3">
            <Typography variant="h6" className="text-lg font-semibold text-black">
              History Entries
            </Typography>
            <Typography className="text-xs text-black">Each record is shown with the original and updated values.</Typography>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="bg-primary text-white">
                <tr>
                  <th className="whitespace-nowrap p-3 text-left text-xs font-semibold uppercase tracking-wide">Action Type</th>
                  <th className="whitespace-nowrap p-3 text-left text-xs font-semibold uppercase tracking-wide">Ticket Index</th>
                  <th className="whitespace-nowrap p-3 text-left text-xs font-semibold uppercase tracking-wide">Old Status</th>
                  <th className="whitespace-nowrap p-3 text-left text-xs font-semibold uppercase tracking-wide">New Status</th>
                  <th className="whitespace-nowrap p-3 text-left text-xs font-semibold uppercase tracking-wide">Old Category</th>
                  <th className="whitespace-nowrap p-3 text-left text-xs font-semibold uppercase tracking-wide">New Category</th>
                  <th className="whitespace-nowrap p-3 text-left text-xs font-semibold uppercase tracking-wide">Old Description</th>
                  <th className="whitespace-nowrap p-3 text-left text-xs font-semibold uppercase tracking-wide">New Description</th>
                  <th className="whitespace-nowrap p-3 text-left text-xs font-semibold uppercase tracking-wide">Old Disputed Amount</th>
                  <th className="whitespace-nowrap p-3 text-left text-xs font-semibold uppercase tracking-wide">New Disputed Amount</th>
                  <th className="whitespace-nowrap p-3 text-left text-xs font-semibold uppercase tracking-wide">Remarks</th>
                  <th className="whitespace-nowrap p-3 text-left text-xs font-semibold uppercase tracking-wide">Changed By Type</th>
                  <th className="whitespace-nowrap p-3 text-left text-xs font-semibold uppercase tracking-wide">Changed By Actor</th>
                  <th className="whitespace-nowrap p-3 text-left text-xs font-semibold uppercase tracking-wide">Changed At</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={14} className="p-6 text-center text-sm text-black">
                      Loading history...
                    </td>
                  </tr>
                ) : sortedHistoryRows.length ? (
                  sortedHistoryRows.map((row, index) => (
                    <tr key={`${row?.id || index}`} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="whitespace-nowrap p-3 text-sm font-medium text-black">{row?.actionType || "-"}</td>
                      <td className="whitespace-nowrap p-3 text-sm text-black">{row?.ticketIndex ?? "-"}</td>
                      <td className="whitespace-nowrap p-3 text-sm">
                        <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold shadow-sm ${getStatusTone(row?.oldStatus)}`}>
                          {formatBadgeText(row?.oldStatus || "-")}
                        </span>
                      </td>
                      <td className="whitespace-nowrap p-3 text-sm">
                        <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold shadow-sm ${getStatusTone(row?.newStatus)}`}>
                          {formatBadgeText(row?.newStatus || "-")}
                        </span>
                      </td>
                      <td className="p-3 text-sm text-black">{row?.oldCategory || "-"}</td>
                      <td className="p-3 text-sm text-black">{row?.newCategory || "-"}</td>
                      <td className="max-w-[220px] p-3 text-sm text-black"><span className="block truncate" title={row?.oldDescription || "-"}>{row?.oldDescription || "-"}</span></td>
                      <td className="max-w-[220px] p-3 text-sm text-black"><span className="block truncate" title={row?.newDescription || "-"}>{row?.newDescription || "-"}</span></td>
                      <td className="whitespace-nowrap p-3 text-sm text-black">{row?.oldDisputedAmount != null ? `₹ ${Number(row.oldDisputedAmount).toFixed(2)}` : "-"}</td>
                      <td className="whitespace-nowrap p-3 text-sm text-black">{row?.newDisputedAmount != null ? `₹ ${Number(row.newDisputedAmount).toFixed(2)}` : "-"}</td>
                      <td className="max-w-[180px] p-3 text-sm text-black"><span className="block truncate" title={row?.remarks || "-"}>{row?.remarks || "-"}</span></td>
                      <td className="whitespace-nowrap p-3 text-sm text-black">{row?.changedByType || "-"}</td>
                      <td className="whitespace-nowrap p-3 text-sm text-black">{row?.changedByUser?.name || row?.changedByActorId || "-"}</td>
                      <td className="whitespace-nowrap p-3 text-sm text-black">{formatDateTime(row?.created_at || row?.updated_at || row?.createdAt || row?.updatedAt)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={14} className="p-6 text-center text-sm text-black">
                      No history records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </DialogBody>
    </Dialog>
  );
}

export default SupportTicketHistoryModal;
