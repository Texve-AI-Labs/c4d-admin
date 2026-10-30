import React from "react";
import { Button, Dialog, DialogBody, DialogFooter, DialogHeader, Spinner } from "@material-tailwind/react";
import moment from "moment";
import { safeText } from "@/utils/text";

const formatDate = (value) => value ? moment(value).format("DD-MM-YYYY hh:mm A") : "-";
const formatStatus = (status) => String(status || "-").replace(/_/g, " ");

const getStatusClass = (status) => {
  switch (String(status || "").toUpperCase()) {
    case "OPEN": return "bg-red-100 text-red-700";
    case "IN_PROGRESS": return "bg-amber-100 text-amber-800";
    case "CLOSED": return "bg-green-100 text-green-700";
    default: return "bg-gray-100 text-gray-700";
  }
};

function ComplianceHistoryModal({ open, row, loading, onClose }) {
  return (
    <Dialog open={open} handler={onClose} size="lg" className="max-h-[90vh] overflow-y-auto">
      <DialogHeader>Compliance History</DialogHeader>
      <DialogBody divider>
        {loading ? (
          <div className="flex justify-center py-10"><Spinner className="h-7 w-7" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] table-auto bg-white text-left">
              <thead className="whitespace-nowrap">
                <tr className="border-y border-blue-700 bg-blue-600 text-white">
                  {["Booking ID", "Rating", "Issue Reason", "Status", "Action", "Review Action", "Assigned By", "In Progress By", "In Progress At", "Closed By", "Closed At", "Closure Notes"].map((heading) => (
                    <th key={heading} className="whitespace-nowrap px-3 py-3 text-xs font-bold uppercase text-white">{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="whitespace-nowrap bg-white">
                <tr>
                  <td className="px-3 py-3 text-sm text-blue-gray-700">{safeText(row?.bookingId)}</td>
                  <td className="px-3 py-3 text-yellow-700">{"★".repeat(Math.min(Math.max(Number(row?.customerRating || 0), 0), 5)) || "-"}</td>
                  <td className="px-3 py-3 text-sm text-blue-gray-700">{safeText(row?.issueReason)}</td>
                  <td className="px-3 py-3"><span className={"rounded-full px-3 py-1 text-xs font-semibold " + getStatusClass(row?.status)}>{formatStatus(row?.status)}</span></td>
                  <td className="px-3 py-3 text-sm text-blue-gray-700">{safeText(row?.action)}</td>
                  <td className="px-3 py-3 text-sm text-blue-gray-700">{row?.inProgressAt || row?.inProgressByUser || row?.inProgressBy ? "Compliance team started review" : "-"}</td>
                  <td className="px-3 py-3 text-sm text-blue-gray-700">{safeText(row?.assignedByUser?.name || row?.assignedBy)}</td>
                  <td className="px-3 py-3 text-sm text-blue-gray-700">{safeText(row?.inProgressByUser?.name || row?.inProgressBy)}</td>
                  <td className="px-3 py-3 text-sm text-blue-gray-700">{formatDate(row?.inProgressAt)}</td>
                  <td className="px-3 py-3 text-sm text-blue-gray-700">{safeText(row?.closedByUser?.name || row?.closedBy)}</td>
                  <td className="px-3 py-3 text-sm text-blue-gray-700">{formatDate(row?.closedAt)}</td>
                  <td className="min-w-[220px] px-3 py-3 text-sm text-blue-gray-700">{safeText(row?.closureNotes)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </DialogBody>
      <DialogFooter><Button variant="text" onClick={onClose}>Close</Button></DialogFooter>
    </Dialog>
  );
}

export default ComplianceHistoryModal;