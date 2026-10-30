import React from "react";
import { Spinner, Typography } from "@material-tailwind/react";
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
  isRefreshing = false,
  hasActiveFilters = false,
  onRefresh,
}) {
  return (
    <div className="mb-4 grid max-w-6xl grid-cols-1 gap-4 md:grid-cols-5">
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
      <div className="flex item-end justify-end mt-7">
        <button
          type="button"
          onClick={onRefresh}
          disabled={!hasActiveFilters || isRefreshing}
          className="flex h-10 min-w-24 items-center justify-center rounded-md bg-red-600 px-4 text-white hover:bg-red/90 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label={isRefreshing ? "Refreshing filters" : "Refresh filters"}
          title={isRefreshing ? "Refreshing filters" : "Refresh filters"}
        >
          {isRefreshing ? <Spinner className="h-5 w-5" /> : "Refresh"}
        </button>
      </div>
    </div>
  );
}

export default TierListFilters;