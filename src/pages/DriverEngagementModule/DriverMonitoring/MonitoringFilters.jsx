import React from "react";
import { Card, CardBody } from "@material-tailwind/react";
import MonitoringSearch from "./MonitoringSearch";

function SelectFilter({ value, onChange, options, formatOptionLabel }) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-11 w-full rounded-lg border border-blue-gray-100 bg-white px-3 text-sm text-blue-gray-700 outline-none focus:border-blue-400"
    >
      {options.map((option) => (
        <option key={option} value={option}>
          {formatOptionLabel ? formatOptionLabel(option) : option}
        </option>
      ))}
    </select>
  );
}

function MonitoringFilters({
  selectedPartnerType,
  onPartnerTypeChange,
  search,
  onSearchChange,
  selectedTier,
  onTierChange,
  selectedZone,
  onZoneChange,
  selectedVehicle,
  onVehicleChange,
  zoneOptions,
}) {
  const partnerTypeOptions = ["CAB", "AUTO","PARCEL","BIKE","DRIVER"];
  const tierOptions = ["ALL", "SILVER", "GOLD", "ELITE"];
  const vehicleOptions = ["ALL"];

  return (
    <Card className="border border-blue-gray-100 shadow-none">
      <CardBody className="p-4">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <MonitoringSearch value={search} onChange={onSearchChange} />
          </div>

          <div className="lg:col-span-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <SelectFilter
              value={selectedPartnerType}
              onChange={onPartnerTypeChange}
              options={partnerTypeOptions}
            />

            <SelectFilter
              value={selectedTier}
              onChange={onTierChange}
              options={tierOptions}
              formatOptionLabel={(option) => (option === "ALL" ? "All Tiers" : option)}
            />

            <select
              value={selectedZone}
              onChange={(event) => onZoneChange(event.target.value)}
              className="h-11 w-full rounded-lg border border-blue-gray-100 bg-white px-3 text-sm text-blue-gray-700 outline-none focus:border-blue-400"
            >
              {zoneOptions.map((zone) => (
                <option key={zone} value={zone}>
                  {zone === "ALL" ? "All Zones" : zone}
                </option>
              ))}
            </select>

            <select
              value={selectedVehicle}
              onChange={(event) => onVehicleChange(event.target.value)}
              className="h-11 w-full hidden rounded-lg border border-blue-gray-100 bg-white px-3 text-sm text-blue-gray-700 outline-none focus:border-blue-400"
            >
              {vehicleOptions.map((vehicle) => (
                <option key={vehicle} value={vehicle}>
                  {vehicle === "ALL" ? "All Vehicles" : vehicle}
                </option>
              ))}
            </select>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

export default MonitoringFilters;
