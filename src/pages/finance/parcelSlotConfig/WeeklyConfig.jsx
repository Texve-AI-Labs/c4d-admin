import React from "react";
import { Button, Input, Switch, Typography } from "@material-tailwind/react";
import { TrashIcon } from "@heroicons/react/24/outline";
import { DAYS } from "./constants";

const normalizeSlotType = (value) => (String(value || "").toUpperCase() === "PEAK" ? "PEAK" : "NORMAL");

const WeeklyConfig = ({
  weeklySlots,
  selectedDays = [],
  errors = {},
  onAddSlot,
  onRemoveSlot,
  onUpdateSlot,
  disabled = false,
}) => {
  const visibleDays = Array.isArray(selectedDays) && selectedDays.length > 0
    ? DAYS.filter((day) => selectedDays.includes(day.value))
    : DAYS;

  return (
    <div className="rounded-xl border p-4">
      <div className="mb-4 flex items-center justify-between">
        <Typography variant="h6" className="font-medium text-black">Weekly Config</Typography>
        <Typography variant="small" className="font-medium text-black">
          Add multiple slots per weekday
        </Typography>
      </div>

      <div className="flex flex-col gap-4">
        {errors.weeklyConfig ? (
          <p className="text-sm text-red-600">{errors.weeklyConfig}</p>
        ) : null}

        {visibleDays.map((day) => {
          const daySlots = weeklySlots?.[day.value] || [];
          return (
            <div key={day.value} className="rounded-lg border p-4">
              <div className="mb-3 flex items-center justify-between">
                <Typography variant="small" className="font-semibold">
                  {day.label}
                </Typography>
                <Button
                  size="sm"
                  type="button"
                  className="bg-green-600 text-white hover:bg-green-700"
                  onClick={() => onAddSlot("weekly", day.value)}
                  disabled={disabled}
                >
                  Add Slot
                </Button>
              </div>
              <div className="flex flex-col gap-3">
                {daySlots.length === 0 ? (
                  <Typography variant="small" className="text-blue-gray-600">
                    No slots added
                  </Typography>
                ) : (
                  daySlots.map((slot, index) => (
                    <div key={`${day.value}-${index}`} className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                      <Input
                        type="time"
                        value={slot.startTime || ""}
                        onChange={(event) => onUpdateSlot("weekly", day.value, index, "startTime", event.target.value)}
                        label="Start Time"
                        disabled={disabled}
                      />
                      <Input
                        type="time"
                        value={slot.endTime || ""}
                        onChange={(event) => onUpdateSlot("weekly", day.value, index, "endTime", event.target.value)}
                        label="End Time"
                        disabled={disabled}
                      />
                      <Input
                        type="number"
                        value={slot.maxBookings || ""}
                        onChange={(event) => onUpdateSlot("weekly", day.value, index, "maxBookings", event.target.value)}
                        label="Max Bookings"
                        disabled={disabled}
                      />
                      <Input
                        type="number"
                        value={slot.expectedEarnings || ""}
                        onChange={(event) => onUpdateSlot("weekly", day.value, index, "expectedEarnings", event.target.value)}
                        label="Expected Earnings"
                        disabled={disabled}
                      />
                      <div className="flex min-h-[40px] items-center rounded-lg border border-blue-gray-100 px-3 py-2">
                        <Switch
                          checked={normalizeSlotType(slot.slotType) === "PEAK"}
                          onChange={(event) =>
                            onUpdateSlot("weekly", day.value, index, "slotType", event.target.checked ? "PEAK" : "NORMAL")
                          }
                          label={normalizeSlotType(slot.slotType)}
                          disabled={disabled}
                        />
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-600 p-0 text-white hover:bg-red-700"
                        onClick={() => onRemoveSlot("weekly", day.value, index)}
                        disabled={disabled}
                        title="Remove slot"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WeeklyConfig;
