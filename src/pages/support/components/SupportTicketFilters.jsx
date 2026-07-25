import React from "react";
import { Button, Input, Option, Select, Typography } from "@material-tailwind/react";

function SupportTicketFilters({
  filters,
  onFilterChange,
  onApplyFilters,
  onClearFilters,
}) {
  return (
    <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <Typography className="mb-4 text-sm font-semibold text-slate-700">Filter Section</Typography>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Select label="Status" value={filters.status} onChange={(value) => onFilterChange("status", value || "")}>
          <Option value="">All</Option>
          <Option value="OPEN">Open</Option>
          <Option value="UNDER_REVIEW">Under Review</Option>
          <Option value="APPROVED">Approved</Option>
          <Option value="REJECTED">Rejected</Option>
          <Option value="RESOLVED">Resolved</Option>
        </Select>

        <Select
          label="Raised By Type"
          value={filters.raisedByType}
          onChange={(value) => onFilterChange("raisedByType", value || "")}
        >
          <Option value="">All</Option>
          <Option value="CUSTOMER">Customer</Option>
        </Select>

        <Input type="number" label="Booking ID" value={filters.bookingId} onChange={(e) => onFilterChange("bookingId", e.target.value)} />
        <Input type="text" label="Category" value={filters.category} onChange={(e) => onFilterChange("category", e.target.value)} />
        <Input type="date" label="From Date" value={filters.fromDate} onChange={(e) => onFilterChange("fromDate", e.target.value)} />
        <Input type="date" label="To Date" value={filters.toDate} onChange={(e) => onFilterChange("toDate", e.target.value)} />
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <Button onClick={onApplyFilters} className="rounded-full bg-blue-900 px-5 py-3 text-xs font-semibold text-white shadow-sm hover:shadow-md">
          Apply Filters
        </Button>
        <Button variant="outlined" onClick={onClearFilters} className="rounded-full border-slate-300 px-5 py-3 text-xs font-semibold text-slate-700">
          Clear Filters
        </Button>
      </div>
    </div>
  );
}

export default SupportTicketFilters;
