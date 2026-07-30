import React from "react";
import { Typography } from "@material-tailwind/react";
import { PARTNER_TYPE_OPTIONS, PARCEL_VEHICLE_TYPE_OPTIONS } from "./typeConstants";

function CommonFieldsSection({ form, onInputChange, serviceAreas = [], showParcelVehicleType = false }) {
  return (
    <>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <div>
          <Typography variant="small" color="blue-gray" className="mb-2 font-semibold">Type</Typography>
          <select name="type" value={form.type} onChange={onInputChange} className="w-full rounded-md border border-blue-gray-200 bg-white px-3 py-2 text-sm text-blue-gray-700 outline-none focus:border-blue-500">
            <option value="TIER_RULES">Tier Rules</option>
            {/* <option value="INCENTIVE_RULES">Incentive Rules</option> */}
            <option value="ONLINE_HOURS_RULES">Online Hours Rules</option>
            <option value="SERVICE_TRIP_RULES">Service Trip Rules</option>
            <option value="DISPATCH_RULES">Dispatch Rules</option>
          </select>
        </div>
        <div>
          <Typography variant="small" color="blue-gray" className="mb-2 font-semibold">Partner Type</Typography>
          <select name="partnerType" value={form.partnerType} onChange={onInputChange} className="w-full rounded-md border border-blue-gray-200 bg-white px-3 py-2 text-sm text-blue-gray-700 outline-none focus:border-blue-500">
            {PARTNER_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Typography variant="small" color="blue-gray" className="mb-2 font-semibold">Name <span className="text-red-500">*</span></Typography>
          <input
            name="name"
            value={form.name}
            onChange={onInputChange}
            placeholder="Rule Name"
            className="w-full rounded-md border border-blue-gray-200 bg-white px-3 py-2 text-sm text-blue-gray-700 outline-none focus:border-blue-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div>
          <Typography variant="small" color="blue-gray" className="mb-2 font-semibold">Zone</Typography>
          <select name="zone" value={form.zone} onChange={onInputChange} className="w-full rounded-md border border-blue-gray-200 bg-white px-3 py-2 text-sm text-blue-gray-700 outline-none focus:border-blue-500">
            <option value="ALL">All</option>
            {serviceAreas.map((area) => (
              <option key={area.id || area.name} value={area.name}>
                {area.name}
              </option>
            ))}
          </select>
        </div>
        {showParcelVehicleType && form.partnerType === "PARCEL" && (
          <div>
            <Typography variant="small" color="blue-gray" className="mb-2 font-semibold">Parcel Vehicle Type</Typography>
            <select
              name="parcelVehicleType"
              value={form.parcelVehicleType}
              onChange={onInputChange}
              className="w-full rounded-md border border-blue-gray-200 bg-white px-3 py-2 text-sm text-blue-gray-700 outline-none focus:border-blue-500"
            >
              {PARCEL_VEHICLE_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}
        <div>
          <Typography variant="small" color="blue-gray" className="mb-2 font-semibold">Description <span className="text-red-500">*</span></Typography>
          <textarea name="description" value={form.description} onChange={onInputChange} rows={4} placeholder="Description" className="w-full rounded-md border border-blue-gray-200 bg-white px-3 py-2 text-sm text-blue-gray-700 outline-none focus:border-blue-500" />
        </div>
      </div>
    </>
  );
}

export default CommonFieldsSection;
