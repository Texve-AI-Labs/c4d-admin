import React from "react";
import { Button, Chip } from "@material-tailwind/react";
import { badgeClassByValue, formatCurrency, formatDateTime, formatProcessedBy } from "../utils";

const WalletTransactionTable = ({ items, selectedId, onSelectRow, allUsers }) => (
  <div className="overflow-hidden rounded-sm border border-slate-200 bg-white shadow-sm">
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead className="bg-primary text-white">
          <tr className="border-b border-slate-200 bg-slate-900 text-left">
            <th className="p-2 text-sm font-semibold text-black-100">Action</th>
            <th className="p-2 text-sm font-semibold text-black-100 whitespace-nowrap">Entity Type</th>
            <th className="p-2 text-sm font-semibold text-black-100">Entity Name</th>
            <th className="p-2 text-sm font-semibold text-black-100">Tier</th>
            <th className="p-2 text-sm font-semibold text-black-100">Amount</th>
            <th className="p-2 text-sm font-semibold text-black-100">Status</th>
            <th className="p-2 text-sm font-semibold text-black-100">Eligibility</th>
            <th className="p-2 text-sm font-semibold text-black-100 whitespace-nowrap">Eligibility Reason</th>
            <th className="p-2 text-sm font-semibold text-black-100 whitespace-nowrap">Wallet Before</th>
            <th className="p-2 text-sm font-semibold text-black-100 whitespace-nowrap">Requested Amount</th>
            <th className="p-2 text-sm font-semibold text-black-100 whitespace-nowrap">Wallet After</th>      
            <th className="p-2 text-sm font-semibold text-black-100">Processed By</th>
            <th className="p-2 text-sm font-semibold text-black-100">Processed At</th>
            {/* <th className="p-2 text-sm font-semibold text-black-100">Payment Txn</th> */}
            {/* <th className="p-2 text-sm font-semibold text-black-100">Admin Reason</th> */}
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => {
            const id = item?.id;
            const isSelected = String(id) === String(selectedId);
            const isInProgress = String(item?.status || "").toUpperCase() === "IN_PROGRESS";
            const processedByRecord =
              typeof item?.processedBy === "object"
                ? item?.processedBy
                : allUsers.find((user) => String(user?.id ?? user?._id ?? user?.userId ?? "").trim() === String(item?.processedBy ?? "").trim()) || null;
            const processedByLabel = processedByRecord ? formatProcessedBy(processedByRecord) : String(item?.processedBy ?? "-");
            return (
              <tr key={`${id || "row"}-${index}`} className={`border-b border-slate-100 align-top transition ${isSelected ? "bg-sky-50" : "hover:bg-slate-50"}`}>
                <td className="p-3 text-sm whitespace-nowrap">
                  <Button size="sm" onClick={() => onSelectRow(item)} className="rounded-full bg-gradient-to-r from-sky-600 to-cyan-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:shadow-md">
                    Review
                  </Button>
                </td>
                <td className="p-3 text-sm whitespace-nowrap">{item?.entityType || "-"}</td>
                <td className="p-3 text-sm whitespace-nowrap">{item?.entityName || "-"}</td>
                <td className="p-3 text-sm whitespace-nowrap">
                  <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold shadow-sm ${badgeClassByValue(item?.tier)}`}>{item?.tier || "-"}</span>
                </td>
                <td className="p-3 text-sm whitespace-nowrap">{formatCurrency(item?.amount)}</td>
                <td className="p-3 text-sm whitespace-nowrap">
                  <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold shadow-sm ${badgeClassByValue(item?.status)}`}>{item?.status || "-"}</span>
                </td>
                <td className="p-3 text-sm whitespace-nowrap">
                  {isInProgress ? (
                    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold shadow-sm ${badgeClassByValue(item?.isStillEligibleForPayment ? "ELIGIBLE" : "NOT ELIGIBLE")}`}>
                      {item?.isStillEligibleForPayment ? "Eligible" : "Not eligible"}
                    </span>
                  ) : (
                    "-"
                  )}
                </td>
                <td className="p-3 text-sm whitespace-nowrap">{isInProgress ? (item?.paymentEligibilityReason ?? "-") : "-"}</td>
                <td className="p-3 text-sm whitespace-nowrap">{formatCurrency(item?.walletBalanceBefore)}</td>
                                <td className="p-3 text-sm whitespace-nowrap">{formatCurrency(item?.amount)}</td>
                <td className="p-3 text-sm whitespace-nowrap">{formatCurrency(item?.walletBalanceAfter)}</td>
                <td className="p-3 text-sm whitespace-nowrap">
                  <span className='inline-flex rounded-full border px-2.5 py-1 bg-gray-100 text-blue-gray-300 text-xs font-semibold shadow-sm'>{processedByLabel}</span>
                </td>
                <td className="p-3 text-sm whitespace-nowrap">{formatDateTime(item?.processedAt)}</td>
                {/* <td className="p-3 text-sm whitespace-nowrap">{item?.paymentTransactionId ?? "-"}</td> */}
                {/* <td className="p-3 text-sm whitespace-nowrap">{item?.adminReason ?? "-"}</td> */}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  </div>
);

export default WalletTransactionTable;