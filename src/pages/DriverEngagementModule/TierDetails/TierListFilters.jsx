import React from "react";
import { Typography } from "@material-tailwind/react";
import { PARTNER_TYPE_OPTIONS, PARCEL_VEHICLE_TYPE_OPTIONS } from "./shared/typeConstants";

function TierListFilters({
  typeFilter,
  statusFilter,
  partnerTypeFilter,
  parcelVehicleTypeFilter,
  onTypeFilterChange,
  onStatusFilterChange,
  onPartnerTypeFilterChange,
  onParcelVehicleTypeFilterChange,
}) {
  return (
    <div className="mb-4 grid max-w-6xl grid-cols-1 gap-4 md:grid-cols-4">
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
          <option value="ONLINE_HOURS_RULES">Online Hours Rules</option>
          <option value="SERVICE_TRIP_RULES">Service Trip Rules</option>
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
          {PARTNER_TYPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <Typography variant="small" color="blue-gray" className="mb-2 font-semibold">
          Parcel Vehicle Type
        </Typography>
        <select
          value={parcelVehicleTypeFilter}
          onChange={(event) => onParcelVehicleTypeFilterChange(event.target.value)}
          disabled={partnerTypeFilter !== "PARCEL"}
          className="w-full rounded-md border border-blue-gray-200 bg-white px-3 py-2 text-sm text-blue-gray-700 outline-none focus:border-blue-500 disabled:bg-blue-gray-50"
        >
          <option value="ALL">All</option>
          {PARCEL_VEHICLE_TYPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export default TierListFilters;