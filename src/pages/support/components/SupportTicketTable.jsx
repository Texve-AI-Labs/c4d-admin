import React from "react";
import { Button, Typography } from "@material-tailwind/react";

function SupportTicketTable({ rows, selectedId, onSelectTicket, onOpenBooking, onOpenHistory, canOpenHistory, formatBadgeText, getStatusTone, formatCurrency, formatDateTime }) {
  return (
    <div className="overflow-hidden rounded-sm border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead className="bg-primary text-white">
            <tr className="border-b border-slate-200 bg-slate-900 text-left">
              <th className="p-2 text-sm font-semibold text-black-100">Booking ID</th>
              <th className="p-2 text-sm font-semibold text-black-100">Category</th>
              {/* <th className="p-2 text-sm font-semibold text-black-100">Description</th> */}
              {/* <th className="p-2 text-sm font-semibold text-black-100">Raised By</th> */}
              <th className="p-2 text-sm font-semibold text-black-100">Status</th>
              <th className="p-2 text-sm font-semibold text-black-100 whitespace-nowrap">Assigned To</th>              
              <th className="p-2 text-sm font-semibold text-black-100">Reward</th>
              <th className="p-2 text-sm font-semibold text-black-100">Created At</th>
              <th className="p-2 text-sm font-semibold text-black-100">Updated At</th>
              <th className="p-2 text-sm font-semibold text-black-100">Action</th>              
            </tr>
          </thead>
          <tbody>
            {rows.map((item, index) => {
              const id = item?.ticketId || item?.id;
              const isSelected = String(id) === String(selectedId);
              return (
                <tr key={`${id || "row"}-${index}`} className={`border-b border-slate-100 align-top transition ${isSelected ? "bg-sky-50" : "hover:bg-slate-50"}`}>
                  <td className="p-3 text-sm whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => onOpenBooking?.(item)}
                      className="font-semibold text-blue-600 underline underline-offset-4 hover:text-blue-700"
                    >
                      {item?.booking?.bookingNumber || "-"}
                    </button>
                  </td>
                
                  <td className="p-3 text-sm whitespace-nowrap">
                    <div className="font-medium text-black-950">{item?.category || "-"}</div>
                  </td>
                  {/* <td className="p-3 text-sm whitespace-nowrap">
                    <div className="max-w-[280px] text-xs leading-5 text-black-700">{item?.description || "-"}</div>
                  </td> */}
                  {/* <td className="p-3 text-sm whitespace-nowrap">
                    <div className="inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold shadow-sm">{formatBadgeText(item?.raisedByType) || "-"}</div>
                  </td> */}
                  <td className="p-3 text-sm whitespace-nowrap">
                    <div className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold shadow-sm ${getStatusTone(item?.status)}`}>{formatBadgeText(item?.status) || "-"}</div>
                  </td>
                    <td className="p-3 text-sm whitespace-nowrap">
                    <div className="font-semibold text-black-950">{item?.statusChangedByUser?.name || "-"}</div>
                  </td>
                  <td className="p-3 text-sm whitespace-nowrap">
                    <div className="font-medium text-black-950">{formatCurrency(item?.rewardAmount)}</div>
                  </td>
                  <td className="p-3 text-sm whitespace-nowrap text-black-700">{formatDateTime(item?.created_at || item?.createdAt)}</td>
                  <td className="p-3 text-sm whitespace-nowrap text-black-700">{formatDateTime(item?.updated_at || item?.updatedAt)}</td>
                  <td className="p-3 text-sm whitespace-nowrap">
                    <Button size="sm" onClick={() => onSelectTicket(item)} className="rounded-full bg-gradient-to-r from-sky-600 to-cyan-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:shadow-md">
                      Review
                    </Button>
                  {canOpenHistory ? (
                    <Button
                      size="sm"
                      variant="outlined"
                      onClick={() => onOpenHistory?.(item)}
                      className="ml-2 rounded-full border-black bg-pink-400 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-slate-800"
                    >
                      History
                    </Button>
                  ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default SupportTicketTable;
