import React from "react";
import { Button, Option, Select, Typography } from "@material-tailwind/react";
import { ENTITY_TYPE_OPTIONS } from "../utils";

const WalletTransactionFilters = ({ searchParams, onFilterChange, onApplyFilters, onClearFilters }) => (
  <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
    <Typography className="mb-4 text-sm font-semibold text-slate-700">Filter Section</Typography>
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <Select label="Entity Type" value={searchParams.entityType} onChange={(value) => onFilterChange("entityType", value || "")}>
        {ENTITY_TYPE_OPTIONS.map((option) => (
          <Option key={option.value || "all"} value={option.value}>
            {option.label}
          </Option>
        ))}
      </Select>
      <Select label="Tier" value={searchParams.tier} onChange={(value) => onFilterChange("tier", value || "")}>
        <Option value="">All</Option>
        <Option value="SILVER">Silver</Option>
        <Option value="GOLD">Gold</Option>
        <Option value="ELITE">Elite</Option>
      </Select>
      <Select label="Status" value={searchParams.status} onChange={(value) => onFilterChange("status", value || "")}>
        <Option value="">All</Option>
        <Option value="IN_PROGRESS">In Progress</Option>
        <Option value="PAID">Paid</Option>
        <Option value="REJECTED">Rejected</Option>
      </Select>
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

export default WalletTransactionFilters;