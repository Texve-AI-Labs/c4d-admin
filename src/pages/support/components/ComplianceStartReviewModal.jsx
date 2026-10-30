import React from "react";
import { Button, Dialog, DialogBody, DialogFooter, DialogHeader } from "@material-tailwind/react";
import moment from "moment";
import { safeText } from "@/utils/text";

const formatDate = (value) => value ? moment(value).format("DD-MM-YYYY hh:mm A") : "-";

function ComplianceStartReviewModal({ open, row, mode = "start", saving, onClose, onStart }) {
  const isStartMode = mode === "start";

  return (
    <Dialog open={open} handler={onClose} size="sm">
      <DialogHeader>{isStartMode ? "Start Compliance Work" : "Compliance Review"}</DialogHeader>
      <DialogBody divider>
        <div className="space-y-3 text-sm text-blue-gray-700">
          <div className="flex justify-between gap-4"><span className="font-semibold">Booking ID</span><span>{safeText(row?.bookingId)}</span></div>
          <div className="flex justify-between gap-4"><span className="font-semibold">Customer</span><span>{safeText(row?.customerName || row?.booking?.Customer?.firstName)}</span></div>
          <div className="flex justify-between gap-4"><span className="font-semibold">Rating</span><span className="text-yellow-700">{"★".repeat(Math.min(Math.max(Number(row?.customerRating || 0), 0), 5)) || "-"}</span></div>
          <div><span className="font-semibold">Issue Reason</span><p className="mt-1 rounded-md bg-blue-gray-50 p-3">{safeText(row?.issueReason)}</p></div>
          <div className="flex justify-between gap-4"><span className="font-semibold">Assigned By</span><span>{safeText(row?.assignedByUser?.name || row?.assignedBy)}</span></div>
          {!isStartMode && (
            <>
              <div className="flex justify-between gap-4"><span className="font-semibold">In Progress By</span><span>{safeText(row?.inProgressByUser?.name || row?.inProgressBy)}</span></div>
              <div className="flex justify-between gap-4"><span className="font-semibold">In Progress At</span><span>{formatDate(row?.inProgressAt)}</span></div>
            </>
          )}
        </div>
      </DialogBody>
      <DialogFooter className="gap-2">
        <Button variant="text" onClick={onClose} disabled={saving}>Close</Button>
        {isStartMode && <Button className="bg-blue-600" onClick={onStart} disabled={saving}>Start Work</Button>}
      </DialogFooter>
    </Dialog>
  );
}

export default ComplianceStartReviewModal;