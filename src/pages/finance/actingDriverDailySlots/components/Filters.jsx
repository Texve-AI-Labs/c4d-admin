import React, { useState } from "react";
import { Button, Input, Option, Select, Typography } from "@material-tailwind/react";

const Filters = ({
  filters,
  zones,
  onChange,
  onReset,
  onFind,
}) => {
  const [submitError, setSubmitError] = useState("");

  const selectedZoneLabel = zones.find((zone) => String(zone.id) === String(filters.zoneId))?.label || "All Zones";

  const handleFind = () => {
    if ((filters.fromDate && !filters.toDate) || (!filters.fromDate && filters.toDate)) {
      setSubmitError("From Date and To Date should be selected together");
      return;
    }

    setSubmitError("");
    onFind?.();
  };

  return (
    <div className=" bg-white p-4 shadow-sm mb-2 border">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-blue-gray-800">Filters</p>
          <p className="text-xs text-blue-gray-500">Search daily slots by date and zone</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            type="button"
            className="rounded-lg bg-blue-600 px-4 py-2 text-white shadow-sm hover:bg-blue-700"
            onClick={handleFind}
          >
            Find
          </Button>
          <Button
            type="button"
            className="rounded-lg bg-red-500 px-4 py-2 text-white shadow-sm hover:bg-red-600"
            onClick={onReset}
          >
            Reset
          </Button>
        </div>
      </div>

      {submitError ? (
        <p className="mb-4 text-sm font-medium text-red-600">{submitError}</p>
      ) : null}

      <div className="flex flex-col gap-5">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-4">
          <Input
            type="date"
            label="Date"
            value={filters.date}
            onChange={(e) => onChange({ date: e.target.value, fromDate: "", toDate: "" })}
          />
          <Input
            type="date"
            label="From Date"
            value={filters.fromDate}
            onChange={(e) => onChange({ fromDate: e.target.value, date: "" })}
          />
          <Input
            type="date"
            label="To Date"
            value={filters.toDate}
            onChange={(e) => onChange({ toDate: e.target.value, date: "" })}
          />
          <Select
            label="Zone"
            value={filters.zoneId}
            selected={() => selectedZoneLabel}
            onChange={(value) => {
              const selected = zones.find((zone) => String(zone.id) === String(value));
              onChange({
                zoneId: value || "",
                zone: selected?.label || "",
              });
            }}
          >
            <Option value="">All Zones</Option>
            {zones.map((zone) => (
              <Option key={zone.id || zone.value} value={zone.id || zone.value}>
                {zone.label}
              </Option>
            ))}
          </Select>
        </div>
      </div>
    </div>
  );
};

export default Filters;
