import React, { useState } from "react";
import { Alert, Button, Dialog, DialogBody, DialogFooter, DialogHeader, Input, Textarea, Typography } from "@material-tailwind/react";
import { formatStatusLabel } from "./utils";

export default function StatusUpdateModal(props) {
  const {
    open,
    onClose,
    statusOptions,
    selectedStatus,
    onStatusChange,
    onStatusUpdate,
    updatingStatus,
    statusError,
    statusRemarks,
    onStatusRemarksChange,
    completionRemarks,
    onCompletionRemarksChange,
    followUpDate,
    followUpTime,
    followUpRemarks,
    onFollowUpDateChange,
    onFollowUpTimeChange,
    onFollowUpRemarksChange,
    notes,
    onNotesChange,
  } = props;
  const [statusOpen, setStatusOpen] = useState(false);
  const labelWithRequired = (label) => (
    <span className="inline-flex items-center gap-1 whitespace-nowrap">
      <span>{label}</span>
      <span className="text-red-500">*</span>
    </span>
  );
  const labelWithOptional = (label) => (
    <span className="inline-flex items-center gap-1 whitespace-nowrap">
      <span>{label}</span>
      <span className="text-blue-gray-500">(optional)</span>
    </span>
  );
  const selectedStatusLabel = formatStatusLabel(selectedStatus) || "Select status";
  const statusLocked = !selectedStatus || updatingStatus;
  const showFollowUpFields = selectedStatus === "FOLLOW_UP_SCHEDULED";
  const showCompletedFields = selectedStatus === "COMPLETED";
  const showCancelledFields = selectedStatus === "CANCELLED";
  const showSimpleRemarks = selectedStatus && !showFollowUpFields && !showCompletedFields;
  const filteredStatusOptions = Array.isArray(statusOptions) ? statusOptions.filter((option) => option !== selectedStatus) : [];

  return (
    <Dialog open={open} handler={onClose} size="lg" className="w-[98vw] max-w-5xl" dismiss={{ outsidePress: false, escapeKey: false }}>
      <DialogHeader className="flex items-center justify-between">
        <Typography variant="h6" className="text-black">
          Status Update
        </Typography>
      </DialogHeader>
      <DialogBody divider className="max-h-[72vh] overflow-y-auto">
        <div className="flex flex-col gap-4 pb-2">
          <div className="rounded-xl border border-blue-gray-100 p-4">
            <Typography variant="small" className="mb-2 font-medium text-blue-gray-700">
              Status
            </Typography>
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:gap-4">
              <div className="relative flex w-full gap-2 md:max-w-[420px]">
                <button
                  type="button"
                  onClick={() => setStatusOpen((prev) => !prev)}
                  className="flex w-full items-center justify-between rounded-lg border border-blue-gray-200 bg-white px-3 py-2 text-left text-sm text-blue-gray-700 transition focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <span className={selectedStatus ? "text-blue-gray-900" : "text-blue-gray-400"}>{selectedStatusLabel}</span>
                  <span className={`ml-3 transition-transform ${statusOpen ? "rotate-180" : ""}`}>⌄</span>
                </button>
                {statusOpen ? (
                  <div className="relative z-[10000] mt-2 w-full max-h-60 overflow-y-auto overflow-x-hidden rounded-lg border border-blue-gray-100 bg-white shadow-xl md:absolute md:left-0 md:top-full md:mt-2">
                    {selectedStatus ? (
                      <div className="cursor-default border-b border-blue-gray-100 px-4 py-3 text-left text-sm font-semibold text-blue-gray-400">
                       {selectedStatusLabel}
                      </div>
                    ) : null}
                    {filteredStatusOptions.map((statusOption) => (
                      <button
                        key={statusOption}
                        type="button"
                        onClick={() => {
                          onStatusChange(statusOption);
                          setStatusOpen(false);
                        }}
                        className={`block w-full px-4 py-3 text-left text-sm hover:bg-blue-gray-50 ${
                          selectedStatus === statusOption ? "bg-blue-gray-50 font-semibold text-blue-gray-900" : "text-blue-gray-700"
                        }`}
                      >
                        {formatStatusLabel(statusOption)}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
          {statusError ? <Alert color="red">{statusError}</Alert> : null}
          {showSimpleRemarks ? (
            <div className="rounded-xl border border-blue-gray-100 p-4">
              <Typography variant="small" className="mb-1 font-medium text-blue-gray-700">
                {labelWithOptional("Status Remarks")}
              </Typography>
              <Textarea value={statusRemarks} onChange={(e) => onStatusRemarksChange(e.target.value)} placeholder="Enter status remarks" />
            </div>
          ) : null}
          {showCancelledFields ? (
            <div className="rounded-xl border border-blue-gray-100 p-4">
              <Typography variant="small" className="mb-1 font-medium text-blue-gray-700">
                {labelWithOptional("Cancellation Remarks")}
              </Typography>
              <Textarea value={statusRemarks} onChange={(e) => onStatusRemarksChange(e.target.value)} placeholder="Enter cancellation remarks" />
            </div>
          ) : null}
          {showFollowUpFields ? (
            <div className="rounded-xl border border-blue-gray-100 p-4">
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap gap-3">
                  <div className="min-w-[220px] flex-1">
                    <Typography variant="small" className="mb-1 font-medium text-blue-gray-700">
                      {labelWithRequired("Follow Up Date")}
                    </Typography>
                    <Input type="date" value={followUpDate} onChange={(e) => onFollowUpDateChange(e.target.value)} />
                  </div>
                  <div className="min-w-[220px] flex-1">
                    <Typography variant="small" className="mb-1 font-medium text-blue-gray-700">
                      {labelWithRequired("Follow Up Time")}
                    </Typography>
                    <Input type="time" value={followUpTime} onChange={(e) => onFollowUpTimeChange(e.target.value)} />
                  </div>
                </div>
                <div>
                  <Typography variant="small" className="mb-1 font-medium text-blue-gray-700">
                    {labelWithOptional("Follow Up Remarks")}
                  </Typography>
                  <Textarea value={followUpRemarks} onChange={(e) => onFollowUpRemarksChange(e.target.value)} placeholder="Enter follow up remarks" />
                </div>
                <div>
                  <Typography variant="small" className="mb-1 font-medium text-blue-gray-700">
                    {labelWithOptional("Status Remarks")}
                  </Typography>
                  <Textarea value={statusRemarks} onChange={(e) => onStatusRemarksChange(e.target.value)} placeholder="Enter status remarks" />
                </div>
                <div className="mt-2 rounded-xl border border-blue-gray-100 p-4">
                  <Typography variant="small" className="mb-2 block font-medium text-blue-gray-700">
                    {labelWithOptional("Notes")}
                  </Typography>
                  <Textarea value={notes} onChange={(e) => onNotesChange(e.target.value)} placeholder="Enter notes" className="mt-1" rows={4} />
                </div>
              </div>
            </div>
          ) : null}
          {showCompletedFields ? (
            <div className="rounded-xl border border-blue-gray-100 p-4">
              <Typography variant="small" className="mb-1 block font-medium text-blue-gray-700">
                {labelWithRequired("Completion Remarks")}
              </Typography>
              <Textarea value={completionRemarks} onChange={(e) => onCompletionRemarksChange(e.target.value)} placeholder="Enter completion remarks" rows={4} />
              <div className="mt-3 rounded-lg bg-green-50 p-3 text-xs font-medium text-green-800">
                Completion will create contract cycles automatically.
              </div>
            </div>
          ) : null}
        </div>
      </DialogBody>
      <DialogFooter>
        <Button variant="text" color="blue-gray" onClick={onClose}>
          Close
        </Button>
        <Button
          className="bg-primary text-white"
          onClick={onStatusUpdate}
          disabled={
            statusLocked ||
            (selectedStatus === "FOLLOW_UP_SCHEDULED" && (!followUpDate || !followUpTime)) ||
            (selectedStatus === "COMPLETED" && !completionRemarks.trim())
          }
        >
          {updatingStatus ? "Updating..." : "Update"}
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
