import React from "react";
import { Button, Input, Option, Select, Textarea, Typography } from "@material-tailwind/react";
import { badgeClassByValue, formatCurrency } from "../utils";

const WalletTransactionReviewPanel = ({
  selectedRow,
  selectedStatus,
  onStatusChange,
  paymentTransactionId,
  onPaymentTransactionIdChange,
  adminReason,
  onAdminReasonChange,
  onUpdateStatus,
  saving,
  isTerminalStatus,
  isNotEligible,
  reviewRef,
}) => {
  return (
    <div ref={reviewRef} className="xl:sticky xl:top-6 h-fit overflow-hidden rounded-[12px] border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-gradient-to-r from-slate-900 to-slate-700 px-5 py-4">
        <Typography variant="h6" className="text-black">
          Withdrawal Review
        </Typography>
        <Typography className="mt-1 text-sm text-slate-200">Selected request details</Typography>
      </div>
      <div className="p-5">
        {selectedRow ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Entity Type</div>
                <div className="mt-1 text-sm font-semibold text-slate-900">{selectedRow?.entityType || "-"}</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Entity Name</div>
                <div className="mt-1 text-sm font-semibold text-slate-900">{selectedRow?.entityName || "-"}</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Requested Amount</div>
                <div className="mt-1 text-sm font-semibold text-slate-900">{formatCurrency(selectedRow?.amount)}</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</div>
                <div className="mt-2">
                  <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold shadow-sm ${badgeClassByValue(selectedRow?.status)}`}>
                    {selectedRow?.status || "-"}
                  </span>
                </div>
              </div>
              {selectedStatus === "IN_PROGRESS" ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:col-span-2">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Eligibility</div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold shadow-sm ${badgeClassByValue(selectedRow?.isStillEligibleForPayment ? "ELIGIBLE" : "NOT ELIGIBLE")}`}>
                      {selectedRow?.isStillEligibleForPayment ? "Eligible" : "Not eligible"}
                    </span>
                    <span className="text-sm text-slate-600">{selectedRow?.paymentEligibilityReason || "-"}</span>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="space-y-3">
              <div className="space-y-2">
                <Typography className="text-sm font-semibold text-slate-700">Status</Typography>
                <Select value={selectedStatus} label="Status" onChange={(value) => onStatusChange(value || "IN_PROGRESS")} disabled={isTerminalStatus || isNotEligible}>
                  <Option value="PAID">Paid</Option>
                  <Option value="REJECTED">Rejected</Option>
                </Select>
              </div>

              {selectedStatus === "PAID" && !isNotEligible ? (
                <div className="space-y-2">
                  <Typography className="text-sm font-semibold text-slate-700">Payment Transaction ID</Typography>
                  <Input
                    type="text"
                    value={paymentTransactionId}
                    onChange={(e) => onPaymentTransactionIdChange(e.target.value)}
                    disabled={isTerminalStatus}
                    className="!border-slate-300 !text-black placeholder:!text-black/40"
                  />
                </div>
              ) : null}

              <div className="space-y-2">
                <Typography className="text-sm font-semibold text-slate-700">Admin Reason</Typography>
                <Textarea
                  value={adminReason}
                  onChange={(e) => onAdminReasonChange(e.target.value)}
                  disabled={isTerminalStatus}
                  className="!border-slate-300 !text-black placeholder:!text-black/40"
                />
              </div>

              <Button onClick={onUpdateStatus} disabled={saving || isTerminalStatus} className="w-full rounded-full bg-gradient-to-r from-slate-900 to-slate-700 px-4 py-3 text-xs font-bold uppercase tracking-wide text-white shadow-none disabled:opacity-60">
                {saving ? "Saving..." : "Update Status"}
              </Button>
            </div>
          </div>
        ) : (
          <Typography className="text-sm text-slate-600">Select a withdrawal request to open its review panel.</Typography>
        )}
      </div>
    </div>
  );
};

export default WalletTransactionReviewPanel;