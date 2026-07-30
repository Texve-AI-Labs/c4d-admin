import React from "react";
import { Typography, Button } from "@material-tailwind/react";
import { METRIC_OPTIONS, PERIOD_OPTIONS, SERVICE_TYPE_OPTIONS, OP_OPTIONS } from "../shared/typeConstants";
import {
  LOCKED_SERVICE_TYPE_OPTIONS,
  getOptionLabel,
  getOptionValue,
  getLockedServiceTypeOptions,
} from "./incentiveRules.utils";

function IncentiveRuleGrid({
  rules,
  setRules,
  onRuleChange,
  removeRule,
  partnerType,
}) {
  const normalizedPartnerType = String(partnerType || "").trim().toUpperCase();
  const lockedVehicleOptions = getLockedServiceTypeOptions(partnerType);
  return (
    <div className="space-y-2">
      {rules.map((rule, index) => (
        <div key={`incentive-rule-${index}`} className="grid grid-cols-1 gap-2 md:grid-cols-7">
          <div>
            <Typography variant="small" color="blue-gray" className="mb-1 text-xs font-semibold">Metric</Typography>
            <select value={rule.metric} onChange={(event) => onRuleChange(setRules, index, "metric", event.target.value)} className="w-full rounded-md border border-blue-gray-200 bg-white px-2 py-2 text-sm">
              {METRIC_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </div>
          <div>
            <Typography variant="small" color="blue-gray" className="mb-1 text-xs font-semibold">Period</Typography>
            <select value={rule.period} onChange={(event) => onRuleChange(setRules, index, "period", event.target.value)} className="w-full rounded-md border border-blue-gray-200 bg-white px-2 py-2 text-sm">
              {PERIOD_OPTIONS.map((option) => <option key={getOptionValue(option)} value={getOptionValue(option)}>{getOptionLabel(option)}</option>)}
            </select>
          </div>
          <div>
            <Typography variant="small" color="blue-gray" className="mb-1 text-xs font-semibold">Service Type</Typography>
            <select
              value={rule.serviceType}
              onChange={(event) => onRuleChange(setRules, index, "serviceType", event.target.value)}
              className="w-full rounded-md border border-blue-gray-200 bg-white px-2 py-2 text-sm"
              disabled={rule.metric === "onlineHours" || normalizedPartnerType === "AUTO" || normalizedPartnerType === "BIKE"}
            >
              {(rule.metric === "onlineHours"
                ? LOCKED_SERVICE_TYPE_OPTIONS
                : normalizedPartnerType === "AUTO" || normalizedPartnerType === "BIKE"
                  ? lockedVehicleOptions
                  : SERVICE_TYPE_OPTIONS
              ).map((option) => (
                <option key={getOptionValue(option)} value={getOptionValue(option)}>{getOptionLabel(option)}</option>
              ))}
            </select>
          </div>
          <div>
            <Typography variant="small" color="blue-gray" className="mb-1 text-xs font-semibold">Operator</Typography>
            <select value={rule.op} onChange={(event) => onRuleChange(setRules, index, "op", event.target.value)} className="w-full rounded-md border border-blue-gray-200 bg-white px-2 py-2 text-sm">
              {OP_OPTIONS.map((option) => <option key={getOptionValue(option)} value={getOptionValue(option)}>{getOptionLabel(option)}</option>)}
            </select>
          </div>
          <div>
            <Typography variant="small" color="blue-gray" className="mb-1 text-xs font-semibold">{rule.metric === "acceptancePct" ? "Value (%)" : "Value"}</Typography>
            <input type="number" value={rule.value} onChange={(event) => onRuleChange(setRules, index, "value", event.target.value)} className="w-full rounded-md border border-blue-gray-200 bg-white px-2 py-2 text-sm" placeholder={rule.metric === "acceptancePct" ? "value(%)" : "value"} />
          </div>
          <div>
            <Typography variant="small" color="blue-gray" className="mb-1 text-xs font-semibold">Amount</Typography>
            <input type="number" value={rule.amount} onChange={(event) => onRuleChange(setRules, index, "amount", event.target.value)} className="w-full rounded-md border border-blue-gray-200 bg-white px-2 py-2 text-sm" placeholder="amount" />
          </div>
          <div>
            <Typography variant="small" color="blue-gray" className="mb-1 text-xs font-semibold">Action</Typography>
            <Button type="button" size="sm" variant="text" color="red" onClick={() => removeRule(setRules, index)}>Remove</Button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default IncentiveRuleGrid;
