import React from "react";
import { Alert, Button, Dialog, DialogBody, DialogFooter, DialogHeader, Spinner, Textarea, Typography } from "@material-tailwind/react";

export default function CycleReviewDialog({
  open,
  onClose,
  cycleNumber,
  cycleLoading,
  cycleError,
  infoRows,
  claimImages,
  onOpenProof,
  cycleStatus,
  onCycleStatusChange,
  cycleRemarks,
  onCycleRemarksChange,
  statusOptions,
  formatStatusLabel,
  onSave,
  cycleSaving,
}) {
  return (
    <Dialog open={open} handler={onClose} size="lg" className="w-[98vw] max-w-5xl" dismiss={{ outsidePress: false, escapeKey: false }}>
      <DialogHeader className="flex items-center justify-between">
        <div>
          <Typography variant="h6" className="text-black">
            Cycle Review
          </Typography>
          <Typography variant="small" className="text-blue-gray-600">
            Cycle {cycleNumber || "-"}
          </Typography>
        </div>
      </DialogHeader>
      <DialogBody divider className="max-h-[72vh] overflow-y-auto">
        {cycleLoading ? (
          <div className="flex items-center justify-center py-8">
            <Spinner className="h-10 w-10" />
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {cycleError ? <Alert color="red">{cycleError}</Alert> : null}
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">{infoRows}</div>

            <div className="rounded-xl border border-blue-gray-100 bg-white p-4">
              <Typography variant="small" className="mb-2 font-medium text-blue-gray-700">
                Claim Proof
              </Typography>
              {claimImages.length ? (
                <div className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Button size="sm" className="bg-primary text-white" onClick={onOpenProof}>
                      Show All Proof
                    </Button>
                    <Typography className="text-xs text-blue-gray-600">
                      {claimImages.length} image{claimImages.length > 1 ? "s" : ""} available
                    </Typography>
                  </div>
                </div>
              ) : (
                <Typography className="text-sm text-blue-gray-600">No claim images submitted.</Typography>
              )}
            </div>

            <div className="rounded-xl border border-blue-gray-100 bg-white p-4">
              <Typography variant="small" className="mb-2 font-medium text-blue-gray-700">
                Update Cycle Status
              </Typography>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <Typography variant="small" className="mb-1 font-medium text-blue-gray-700">
                    Status
                  </Typography>
                  <select
                    value={cycleStatus}
                    onChange={(e) => onCycleStatusChange(e.target.value)}
                    className="w-full rounded-lg border border-blue-gray-200 bg-white px-3 py-2 text-sm text-blue-gray-700 focus:border-black focus:outline-none"
                  >
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>
                        {formatStatusLabel(status)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Typography variant="small" className="mb-1 font-medium text-blue-gray-700">
                    Remarks
                  </Typography>
                  <Textarea value={cycleRemarks} onChange={(e) => onCycleRemarksChange(e.target.value)} placeholder="Enter review remarks" rows={4} />
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogBody>
      <DialogFooter>
        <Button variant="text" color="red" onClick={onClose}>
          Close
        </Button>
        <Button className="bg-primary text-white" onClick={onSave} disabled={cycleSaving || cycleLoading || !cycleStatus}>
          {cycleSaving ? "Updating..." : "Update Status"}
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
