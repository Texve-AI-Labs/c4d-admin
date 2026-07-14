import React from "react";
import { Card, CardBody, Typography } from "@material-tailwind/react";

const PARTNER_TYPES = [
  // "DRIVER",
  // "ALL", 
  "CAB",
  "AUTO",
  "BIKE",
];
const STATUS_OPTIONS = [
  { label: "All", value: "ALL" },
  { label: "Active", value: "ACTIVE" },
  { label: "Inactive", value: "INACTIVE" },
];

const toLabelCase = (value = "") => {
  const text = String(value || "").trim().toLowerCase();
  if (!text) return "";
  return text.charAt(0).toUpperCase() + text.slice(1);
};

const formatZoneLabel = (value = "") => {
  const text = String(value || "").trim();
  if (!text) return "";
  const isUpperToken = /^[A-Z0-9 _-]+$/.test(text);
  return isUpperToken ? toLabelCase(text) : text;
};

function DriverIncentiveFilters({
  partnerType,
  status,
  zone,
  zoneOptions,
  onPartnerTypeChange,
  onStatusChange,
  onZoneChange,
}) {
  return (
    <Card className="border border-blue-gray-100 shadow-none">
      <CardBody className="p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div>
            <Typography variant="small" className="mb-1 font-semibold text-blue-gray-700">
              Partner Type
            </Typography>
            <select
              value={partnerType}
              onChange={(event) => onPartnerTypeChange(event.target.value)}
              // disabled
              className="h-11 w-full rounded-lg border border-blue-gray-100 bg-white px-3 text-sm text-blue-gray-700 outline-none focus:border-blue-400"
            >
              {PARTNER_TYPES.map((item) => (
                <option key={item} value={item}>
                  {toLabelCase(item)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Typography variant="small" className="mb-1 font-semibold text-blue-gray-700">
              Status
            </Typography>
            <select
              value={status}
              onChange={(event) => onStatusChange(event.target.value)}
              className="h-11 w-full rounded-lg border border-blue-gray-100 bg-white px-3 text-sm text-blue-gray-700 outline-none focus:border-blue-400"
            >
              {STATUS_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Typography variant="small" className="mb-1 font-semibold text-blue-gray-700">
              Zone
            </Typography>
            <select
              value={zone}
              onChange={(event) => onZoneChange(event.target.value)}
              className="h-11 w-full rounded-lg border border-blue-gray-100 bg-white px-3 text-sm text-blue-gray-700 outline-none focus:border-blue-400"
            >
              {zoneOptions.map((item) => (
                <option key={item.value} value={item.value}>
                  {formatZoneLabel(item.label)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

export default DriverIncentiveFilters;
