import React from "react";
import { Checkbox, Typography } from "@material-tailwind/react";
import { DAYS } from "./constants";

const DaysOfWeekSelector = ({ value = [], error, onChange, disabled = false }) => {
  const selected = Array.isArray(value) ? value : [];

  const toggleDay = (dayValue) => {
    const next = selected.includes(dayValue)
      ? selected.filter((item) => item !== dayValue)
      : [...selected, dayValue];
    onChange(next);
  };

  return (
    <div className="rounded-xl border  p-4">
      <div className="mb-4 flex items-center justify-between">
        <Typography variant="h6" className="font-medium text-black">
          Days Of Week <span className="ml-1 text-red-500">*</span>
        </Typography>
        <Typography variant="small" className="font-medium text-black">
          Select one or more weekdays
        </Typography>
      </div>

      <div className="flex flex-wrap gap-3">
        {DAYS.map((day) => (
          <label
            key={day.value}
            className="flex min-w-[140px] items-center gap-2 rounded-lg border bg-white px-3 py-2"
          >
            <Checkbox
              checked={selected.includes(day.value)}
              onChange={() => toggleDay(day.value)}
              disabled={disabled}
            />
            <Typography variant="small" className="font-medium text-blue-gray-700">
              {day.label}
            </Typography>
          </label>
        ))}
      </div>

      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
    </div>
  );
};

export default DaysOfWeekSelector;