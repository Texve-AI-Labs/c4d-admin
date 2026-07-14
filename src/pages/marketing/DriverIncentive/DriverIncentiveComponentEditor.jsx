import React from "react";
import { Button, Typography } from "@material-tailwind/react";
import { PAYOUT_FREQUENCY_OPTIONS, PERIOD_OPTIONS, SERVICE_TYPE_OPTIONS_BY_CODE } from "./edit.constants";
import { createDefaultRule, getOptionLabel, getOptionValue, withCurrentOption } from "./edit.utils";

function DriverIncentiveComponentEditor({
  form,
  onInputChange,
  onPayoutFrequencyChange,
  componentRules,
  setComponentRules,
}) {
  const normalizedCode =
    form.code === "ONLINE_HOURS_RULES"
      ? "ONLINE_HOURS_BONUS"
      : form.code === "SERVICE_TRIP_RULES"
        ? "SERVICE_TRIP_BONUS"
        : form.code;
  const isAutoPartner = String(form.partnerType || "").trim().toUpperCase() === "AUTO";
  const isBikePartnerType = String(form.partnerType || "").trim().toUpperCase() === "BIKE";
  const isRuleBasedComponent =
    normalizedCode === "ONLINE_HOURS_BONUS" || normalizedCode === "SERVICE_TRIP_BONUS";
  const componentTitleMap = {
    ONLINE_HOURS_BONUS: "Online Hours Bonus",
    SERVICE_TRIP_BONUS: "Service Trip Bonus",
  };
  const isBikePartner = String(form.partnerType || "").trim().toUpperCase() === "BIKE";
  const metricOptionsByCode = {
    ONLINE_HOURS_BONUS: [{ value: "onlineHours", label: "Online Hours" }],
    SERVICE_TRIP_BONUS: [{ value: "tripCount", label: "Trip Count" }],
  };
  const componentTitle = componentTitleMap[normalizedCode] || form.code || "-";

  return (
    <div className="rounded-lg border border-blue-gray-100 p-4">
      <Typography variant="small" color="blue-gray" className="mb-3 font-semibold">
        {componentTitle}
      </Typography>
    <div className="flex gap-4">
      <div className="gap-2">
          <Typography variant="small" color="blue-gray" className="mb-1 font-semibold">
            Payout Frequency
          </Typography>
          <select
            value={form.payoutFrequency}
            onChange={(event) => onPayoutFrequencyChange(event.target.value)}
            className="w-full rounded-md border border-blue-gray-200 px-3 py-2 text-sm"
          >
            {PAYOUT_FREQUENCY_OPTIONS.map((frequency) => (
              <option key={getOptionValue(frequency)} value={getOptionValue(frequency)}>
                {getOptionLabel(frequency)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Typography variant="small" color="blue-gray" className="mb-1 font-semibold">
            Valid From
          </Typography>
          <input
            type="datetime-local"
            value={form.validFrom}
            onChange={(event) => onInputChange("validFrom", event.target.value)}
            className="w-full rounded-md border border-blue-gray-200 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <Typography variant="small" color="blue-gray" className="mb-1 font-semibold">
            Valid To
          </Typography>
          <input
            type="datetime-local"
            value={form.validTo}
            onChange={(event) => onInputChange("validTo", event.target.value)}
            className="w-full rounded-md border border-blue-gray-200 px-3 py-2 text-sm"
          />
        </div>
        <div className="justify-end items-end">
        <label className="inline-flex gap-2">
          <input
            type="checkbox"
            checked={form.enabled}
            onChange={(event) => onInputChange("enabled", event.target.checked)}
            className="h-4 w-4 rounded border-blue-gray-300"
          />
          <Typography variant="small" color="blue-gray" className="font-semibold">
            Enabled
          </Typography>
        </label>
        </div>
        </div>
        

      {isRuleBasedComponent && (
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between">
            <Typography variant="small" color="blue-gray" className="font-semibold">
              Rules
            </Typography>
            <Button
              type="button"
              size="sm"
              variant="outlined"
              color="blue"
              onClick={() =>
                setComponentRules((prev) => [
                  ...prev,
                  { ...createDefaultRule(form.code, form.partnerType), period: form.payoutFrequency || "WEEKLY" },
                ])
              }
            >
              Add Rule
            </Button>
          </div>

          {componentRules.map((rule, index) => (
            <div
              key={`${form.code}-rule-${index}`}
              className="grid grid-cols-1 gap-3 rounded-md border border-blue-gray-100 p-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-[minmax(130px,1.1fr)_minmax(96px,0.8fr)_minmax(140px,1.1fr)_minmax(84px,0.6fr)_minmax(110px,0.8fr)_minmax(130px,0.9fr)_auto]"
            >
              <div>
                <Typography variant="small" color="blue-gray" className="mb-1 text-xs font-semibold">
                  Metric
                </Typography>
                <select
                  value={rule.metric}
                  onChange={(event) =>
                    setComponentRules((prev) =>
                      prev.map((item, idx) =>
                        idx === index ? { ...item, metric: event.target.value } : item
                      )
                    )
                  }
                  className="w-full rounded-md border border-blue-gray-200 px-2 py-2 text-xs"
                >
                  {metricOptionsByCode[normalizedCode]?.map((metricOption) => (
                    <option key={`${form.code}-metric-${metricOption.value}`} value={metricOption.value}>
                      {metricOption.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Typography variant="small" color="blue-gray" className="mb-1 text-xs font-semibold">
                  Period
                </Typography>
                <select
                  value={form.payoutFrequency}
                  disabled
                  className="w-full rounded-md border border-blue-gray-200 px-2 py-2 text-xs"
                >
                  {withCurrentOption(PERIOD_OPTIONS, form.payoutFrequency).map((periodValue) => (
                    <option
                      key={`${form.code}-period-${getOptionValue(periodValue)}`}
                      value={getOptionValue(periodValue)}
                    >
                      {getOptionLabel(periodValue)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Typography variant="small" color="blue-gray" className="mb-1 text-xs font-semibold">
                  Service Type
                </Typography>
                <select
                  value={rule.serviceType}
                  onChange={(event) =>
                    setComponentRules((prev) =>
                      prev.map((item, idx) =>
                        idx === index ? { ...item, serviceType: event.target.value } : item
                      )
                    )
                  }
                  className="w-full rounded-md border border-blue-gray-200 px-2 py-2 text-xs"
                  disabled={isAutoPartner || isBikePartner}
                >
                  {withCurrentOption(
                    isAutoPartner
                      ? [{ value: "AUTO", label: "Auto" }]
                      : isBikePartner
                        ? [{ value: "BIKE", label: "Bike" }]
                      : SERVICE_TYPE_OPTIONS_BY_CODE[form.code] || [{ value: "RIDES", label: "Rides" }],
                    rule.serviceType
                  ).map((serviceTypeOption) => (
                    <option
                      key={`${form.code}-service-${getOptionValue(serviceTypeOption)}`}
                      value={getOptionValue(serviceTypeOption)}
                    >
                      {getOptionLabel(serviceTypeOption)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Typography variant="small" color="blue-gray" className="mb-1 text-xs font-semibold">
                  Operator
                </Typography>
                <input
                  value={rule.op}
                  onChange={(event) =>
                    setComponentRules((prev) =>
                      prev.map((item, idx) =>
                        idx === index ? { ...item, op: event.target.value } : item
                      )
                    )
                  }
                  className="w-full rounded-md border border-blue-gray-200 px-2 py-2 text-xs"
                />
              </div>
              <div>
                <Typography variant="small" color="blue-gray" className="mb-1 text-xs font-semibold">
                  Value
                </Typography>
                <input
                  type="number"
                  value={rule.value}
                  onChange={(event) =>
                    setComponentRules((prev) =>
                      prev.map((item, idx) =>
                        idx === index ? { ...item, value: event.target.value } : item
                      )
                    )
                  }
                  className="w-full rounded-md border border-blue-gray-200 px-2 py-2 text-xs"
                />
              </div>
              <div className="min-w-[120px]">
                  <Typography variant="small" color="blue-gray" className="mb-1 text-xs font-semibold">
                    Amount
                  </Typography>
                  <input
                    type="number"
                    value={rule.amount}
                    onChange={(event) =>
                      setComponentRules((prev) =>
                        prev.map((item, idx) =>
                          idx === index ? { ...item, amount: event.target.value } : item
                        )
                      )
                    }
                    className="w-full rounded-md border border-blue-gray-200 px-2 py-2 text-xs"
                  />
                </div>
              <div className="flex items-end justify-start xl:justify-end xl:min-w-[88px]">
                <Button
                  type="button"
                  size="sm"
                  variant="text"
                  color="red"
                  className="whitespace-nowrap px-8"
                  onClick={() => setComponentRules((prev) => prev.filter((_, idx) => idx !== index))}
                  disabled={componentRules.length <= 1}
                >
                  Remove
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default DriverIncentiveComponentEditor;
