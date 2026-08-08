import React, { useEffect, useState } from "react";
import { Button, Input, Option, Select, Textarea, Typography } from "@material-tailwind/react";
import { getStatusTone, shouldShowReviewFields } from "../supportTicketReviewUtils";
const ADMIN_REMARK_OPTIONS = [
  "Reviewed and rejected",
  "Invalid proof",
  "Policy not applicable",
  "Need further investigation",
  "Other",
];

const ErrorMessage = ({ children }) => {
  if (!children) return null;
  return <Typography className="text-xs font-medium text-red-600">{children}</Typography>;
};

function SupportTicketDetails({
  ticket,
  booking,
  customer,
  selectedStatus,
  allowedStatusOptions,
  rewardAmount,
  rewardReason,
  adminRemarks,
  fieldErrors,
  isTerminalTicket,
  onStatusChange,
  onRewardAmountChange,
  onRewardReasonChange,
  onAdminRemarksChange,
  onOpenProof,
  onUpdateStatus,
  saving,
}) {
  const { isRejected, showReviewFields } = shouldShowReviewFields(selectedStatus, selectedStatus);
  const [adminRemarkMode, setAdminRemarkMode] = useState(
    adminRemarks && !ADMIN_REMARK_OPTIONS.includes(adminRemarks) ? "Other" : adminRemarks || ""
  );

  useEffect(() => {
    setAdminRemarkMode(adminRemarks && !ADMIN_REMARK_OPTIONS.includes(adminRemarks) ? "Other" : adminRemarks || "");
  }, [adminRemarks]);

  const statusTone = getStatusTone(selectedStatus);
  const statusClassName = isTerminalTicket
    ? "!rounded-full !border-0 !bg-slate-200 !text-slate-500 !cursor-not-allowed"
    : `!rounded-full !border-0 transition-colors ${statusTone} !text-white`;
  const selectClassName = "w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-none outline-none transition focus:border-blue-500";

  return (
    <div className="overflow-hidden rounded-[12px] border border-slate-200 bg-white shadow-sm">
      {/* <div className="border-b border-slate-200 bg-gradient-to-r from-slate-900 to-slate-700 px-4 py-3 text-white">
        <Typography variant="h6" className="text-sm font-semibold text-black">Ticket Review</Typography>
        <Typography className="mt-1 text-xs text-black">Selected ticket details and update controls</Typography>
      </div> */}
      <div className="p-4">
        {ticket ? (
          <div className="space-y-3">
            <div className="space-y-2">
              <InfoCard label="Ticket ID" value={ticket?.ticketId || "-"} />
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <InfoCard label="Category" value={ticket?.category || "-"} />
                {/* <InfoCard label="Booking ID" value={booking?.bookingNumber || "-"} /> */}
                <InfoCard label="Customer" value={customer?.firstName || customer?.name || "-"} />
                <InfoCard label="Disputed Amount" value={ticket?.disputedAmount ? `₹ ${Number(ticket?.disputedAmount).toFixed(2)}` : "-"} />
                <InfoCard label="Proof" value={ticket?.proofUrl ? "Available" : "Not provided"} />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <div className="space-y-2">
                <Typography className="text-xs font-semibold text-black">Status <span className="text-red-600">*</span></Typography>
                <Select
                  value={selectedStatus}
                  label=" "
                  selected={(element) => element?.props?.children || selectedStatus}
                  onChange={(value) => onStatusChange(value || "UNDER_REVIEW")}
                  disabled={isTerminalTicket}
                  labelProps={{ className: "hidden" }}
                  className={`${statusClassName} ${isTerminalTicket ? statusClassName : ""}`}
                >
                  {allowedStatusOptions.map((option) => (
                    <Option key={option} value={option}>{option.replace(/_/g, " ")}</Option>
                  ))}
                </Select>
              </div>

              {showReviewFields ? (
                <>
                  <div className="space-y-2">
                    <Typography className="text-xs font-semibold text-black">Reward Amount</Typography>
                    <Input
                      type="number"
                      value={rewardAmount}
                      onChange={(e) => onRewardAmountChange(e.target.value)}
                      disabled={isTerminalTicket || isRejected}
                      className="!border-slate-300 !text-black placeholder:!text-black/40"
                    />
                    <ErrorMessage>{fieldErrors.rewardAmount}</ErrorMessage>
                  </div>
                  <div className="space-y-2">
                    <Typography className="text-xs font-semibold text-black">Reward Reason</Typography>
                    <Textarea
                      value={rewardReason}
                      onChange={(e) => onRewardReasonChange(e.target.value)}
                      disabled={isTerminalTicket || isRejected}
                      className="!border-slate-300 !text-black placeholder:!text-black/40"
                    />
                    <ErrorMessage>{fieldErrors.rewardReason}</ErrorMessage>
                  </div>
                </>
              ) : isRejected ? (
                <>
                  <div className="space-y-2">
                    <Typography className="text-xs font-semibold text-black">Reward Amount</Typography>
                    <Input
                      type="number"
                      value={rewardAmount}
                      onChange={(e) => onRewardAmountChange(e.target.value)}
                      disabled={isTerminalTicket || isRejected}
                      className="!border-slate-300 !text-black placeholder:!text-black/40"
                    />
                  </div>
                  <div className="space-y-2">
                    <Typography className="text-xs font-semibold text-black">Reward Reason</Typography>
                    <Textarea
                      value={rewardReason}
                      onChange={(e) => onRewardReasonChange(e.target.value)}
                      disabled={isTerminalTicket || isRejected}
                      className="!border-slate-300 !text-black placeholder:!text-black/40"
                    />
                  </div>
                  <div className="space-y-2">
                    <Typography className="text-xs font-semibold text-black">Admin Remarks</Typography>
                    <div className="relative">
                      <select
                        value={adminRemarkMode}
                        onChange={(e) => {
                          const nextValue = e.target.value || "";
                          setAdminRemarkMode(nextValue);
                          if (nextValue !== "Other") {
                            onAdminRemarksChange(nextValue);
                          }
                        }}
                        disabled={isTerminalTicket}
                        className={`${selectClassName} w-full appearance-none pr-10`}
                      >
                        <option value="" disabled>
                          Select admin remarks
                        </option>
                        {ADMIN_REMARK_OPTIONS.map((remark) => (
                          <option key={remark} value={remark}>
                            {remark}
                          </option>
                        ))}
                      </select>
                      <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-500">
                        ▾
                      </span>
                    </div>
                    {adminRemarkMode === "Other" ? (
                    <Textarea
                      value={adminRemarks}
                      onChange={(e) => onAdminRemarksChange(e.target.value)}
                      disabled={isTerminalTicket}
                      placeholder="Enter support reason manually"
                      className="!border-slate-300 !text-black placeholder:!text-black/40"
                    />
                    ) : null}
                    <ErrorMessage>{fieldErrors.adminRemarks}</ErrorMessage>
                  </div>
                </>
              ) : null}
            </div>

            {ticket?.proofUrl ? (
              <Button
                variant="outlined"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenProof();
                }}
                className="w-full rounded-full border-slate-300 px-4 py-3 text-xs font-bold uppercase tracking-wide text-black"
              >
                Open proof attachment
              </Button>
            ) : null}

            <Button onClick={onUpdateStatus} disabled={saving} className="w-full rounded-full bg-gradient-to-r from-slate-900 to-slate-700 px-4 py-3 text-xs font-bold uppercase tracking-wide text-white shadow-none disabled:opacity-60">
              {saving ? "Saving..." : "Update Status"}
            </Button>
          </div>
        ) : (
          <Typography className="mt-4 text-sm text-black">Select a ticket to inspect details and update its workflow status.</Typography>
        )}
      </div>
    </div>
  );
}

const InfoCard = ({ label, value }) => (
  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
    <Typography className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</Typography>
    <Typography className="mt-1 text-sm font-semibold text-slate-900">{value}</Typography>
  </div>
);

export default SupportTicketDetails;
