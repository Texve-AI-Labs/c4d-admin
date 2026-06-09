import React from "react";
import { Typography } from "@material-tailwind/react";

function TierListFilters({
  typeFilter,
  statusFilter,
  partnerTypeFilter,
  onTypeFilterChange,
  onStatusFilterChange,
  onPartnerTypeFilterChange,
}) {
  return (
    <div className="mb-4 grid max-w-4xl grid-cols-1 gap-4 md:grid-cols-3">
      <div>
        <Typography variant="small" color="blue-gray" className="mb-2 font-semibold">
          Type Filter
        </Typography>
        <select
          value={typeFilter}
          onChange={(event) => onTypeFilterChange(event.target.value)}
          className="w-full rounded-md border border-blue-gray-200 bg-white px-3 py-2 text-sm text-blue-gray-700 outline-none focus:border-blue-500"
        >
          <option value="ALL">All</option>
          <option value="TIER_RULES">Tier Rules</option>
          {/* <option value="INCENTIVE_RULES">Incentive Rules</option> */}
          <option value="DISPATCH_RULES">Dispatch Rules</option>
        </select>
      </div>

      <div>
        <Typography variant="small" color="blue-gray" className="mb-2 font-semibold">
          Status Filter
        </Typography>
        <select
          value={statusFilter}
          onChange={(event) => onStatusFilterChange(event.target.value)}
          className="w-full rounded-md border border-blue-gray-200 bg-white px-3 py-2 text-sm text-blue-gray-700 outline-none focus:border-blue-500"
        >
          <option value="ALL">All</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </div>

      <div>
        <Typography variant="small" color="blue-gray" className="mb-2 font-semibold">
          Partner Type
        </Typography>
        <select
          value={partnerTypeFilter}
          onChange={(event) => onPartnerTypeFilterChange(event.target.value)}
          // disabled
          className="w-full rounded-md border border-blue-gray-200 bg-white px-3 py-2 text-sm text-blue-gray-700 outline-none focus:border-blue-500"
        >
          <option value="ALL">All</option>
          <option value="CAB">Cab</option>
          <option value="AUTO">Auto</option>
        </select>
      </div>
    </div>
  );
}

export default TierListFilters;
