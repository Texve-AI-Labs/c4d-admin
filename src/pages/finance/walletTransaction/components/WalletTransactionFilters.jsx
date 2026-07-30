import React from "react";
import { Button, Option, Select, Typography } from "@material-tailwind/react";
import { ENTITY_TYPE_OPTIONS } from "../utils";

const WalletTransactionFilters = ({ searchParams, onFilterChange, onApplyFilters, onClearFilters }) => (
  <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
    <Typography className="mb-4 text-sm font-semibold text-slate-700">Filter Section</Typography>
    <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:flex-nowrap">
      <div className="w-full xl:w-[220px]">
      <Select label="Entity Type" value={searchParams.entityType} onChange={(value) => onFilterChange("entityType", value || "")}>
        {ENTITY_TYPE_OPTIONS.map((option) => (
          <Option key={option.value || "all"} value={option.value}>
            {option.label}
          </Option>
        ))}
      </Select>
      </div>
      <div className="w-full xl:w-[220px]">
      <Select label="Tier" value={searchParams.tier} onChange={(value) => onFilterChange("tier", value || "")}>
        <Option value="">All</Option>
        <Option value="SILVER">Silver</Option>
        <Option value="GOLD">Gold</Option>
        <Option value="ELITE">Elite</Option>
      </Select>
      </div>
      <div className="w-full xl:w-[220px]">
      <Select label="Status" value={searchParams.status} onChange={(value) => onFilterChange("status", value || "")}>
        <Option value="">All</Option>
        <Option value="IN_PROGRESS">In Progress</Option>
        <Option value="PAID">Paid</Option>
        <Option value="REJECTED">Rejected</Option>
      </Select>
    </div>
    <div className="flex w-full gap-3 xl:w-auto xl:ml-auto xl:justify-end">
      <Button onClick={onApplyFilters} className="w-full rounded-full bg-blue-900 px-4 py-2 text-[11px] font-semibold text-white shadow-sm hover:shadow-md xl:min-w-[120px]">
        Apply Filters
      </Button>
      <Button variant="outlined" onClick={onClearFilters} className="w-full rounded-full border-slate-300 px-4 py-2 text-[11px] font-semibold text-slate-700 xl:min-w-[120px]">
        Clear Filters
      </Button>
      </div>
    </div>
  </div>
);

export default WalletTransactionFilters;