import React, { useEffect, useMemo, useState } from "react";
import { Typography, Button } from "@material-tailwind/react";
import { mapServiceDetails } from "../shared/ruleMappings";
import { TIER_KEYS, METRIC_OPTIONS, PERIOD_OPTIONS, SERVICE_TYPE_OPTIONS, OP_OPTIONS } from "../shared/typeConstants";
import { isBikePartner } from "../shared/componentRuleUtils";

const createCondition = () => ({
  metric: "onlineHours",
  period: "DAILY",
  serviceType: "ANY",
  op: ">=",
  value: "1",
  isMandatory: true,
});

const initialTierConditions = {
  SILVER: [createCondition()],
  GOLD: [createCondition()],
  ELITE: [createCondition()],
};

const getTierKey = (tierItem) =>
  typeof tierItem === "string" ? tierItem : tierItem?.value || tierItem?.id || "";

const getTierLabel = (tierItem) =>
  typeof tierItem === "string" ? tierItem : tierItem?.label || tierItem?.value || tierItem?.id || "";

const getOptionValue = (option) =>
  typeof option === "string" ? option : option?.value || "";

const getOptionLabel = (option) =>
  typeof option === "string" ? option : option?.label || option?.value || "";

const getUiServiceType = (condition = {}) => {
  if (condition.serviceType === "ANY") return "ANY";
  if (condition.serviceType === "RIDES") return "RIDES";
  if (condition.serviceType === "RENTAL" && condition.packageType === "Local") {
    return "RENTAL_HOURLY_PACKAGE";
  }
  if (condition.serviceType === "RENTAL" && condition.bookingType === "ROUND_TRIP" && condition.packageType === "Outstation") {
    return "RENTAL";
  }
  if (condition.serviceType === "RENTAL" && condition.bookingType === "DROP_ONLY" && condition.packageType === "Outstation") {
    return "RENTAL_DROP_TAXI";
  }
  return condition.serviceType || "RIDES";
};

const LOCKED_SERVICE_TYPE_OPTIONS = [{ label: "All", value: "ANY" }];

function TierRulesSection({ registerBuilder, initialConfig = {}, partnerType = "CAB" }) {
  const normalizedPartnerType = String(partnerType || "").trim().toUpperCase();
  const isBike = isBikePartner(normalizedPartnerType);
  const [evaluation, setEvaluation] = useState({
    weekStart: "MONDAY",
    timezone: "Asia/Kolkata",
    upgradeStep: 1,
    downgradeStep: 1,
  });
  const [fallbackPolicy] = useState({
    silverIsFloor: true,
    onMissingMetrics: "FAIL_MANDATORY",
  });
  const [tierConditions, setTierConditions] = useState(initialTierConditions);

  useEffect(() => {
    if (!initialConfig || typeof initialConfig !== "object") return;

    if (initialConfig.evaluation && typeof initialConfig.evaluation === "object") {
      setEvaluation((prev) => ({
        ...prev,
        ...initialConfig.evaluation,
      }));
    }

    const tiers = initialConfig?.tiers;
    if (!tiers || typeof tiers !== "object") return;

    setTierConditions(
      Object.fromEntries(
        TIER_KEYS.map((tierItem) => {
          const tierKey = getTierKey(tierItem);
          const conditions = tiers?.[tierKey]?.conditions;
          const mappedConditions =
            Array.isArray(conditions) && conditions.length > 0
              ? conditions.map((condition) => ({
                metric: condition?.metric || "onlineHours",
                period: condition?.period || "DAILY",
                serviceType:
                  (condition?.metric || "onlineHours") === "onlineHours"
                    ? "ANY"
                    : normalizedPartnerType === "AUTO"
                      ? "AUTO"
                      : isBike
                        ? "BIKE"
                      : getUiServiceType(condition),
                op: condition?.op || ">=",
                value: String(condition?.value ?? ""),
                isMandatory:
                  typeof condition?.isMandatory === "boolean" ? condition.isMandatory : true,
              }))
              : [createCondition()];

          return [tierKey, mappedConditions];
        })
      )
    );
  }, [initialConfig, partnerType]);

  const onConditionChange = (tierKey, index, field, nextValue) => {
    setTierConditions((prev) => ({
      ...prev,
      [tierKey]: (Array.isArray(prev[tierKey]) ? prev[tierKey] : []).map((condition, idx) =>
        idx === index
          ? field === "metric"
            ? {
              ...condition,
              metric: nextValue,
              serviceType:
                nextValue === "onlineHours"
                  ? "ANY"
                  : normalizedPartnerType === "AUTO"
                    ? "AUTO"
                    : isBike
                      ? "BIKE"
                    : condition.serviceType === "ANY"
                      ? "RIDES"
                      : condition.serviceType,
            }
            : { ...condition, [field]: nextValue }
          : condition
      ),
    }));
  };

  useEffect(() => {
    setTierConditions((prev) =>
      Object.fromEntries(
        TIER_KEYS.map((tierItem) => {
          const tierKey = getTierKey(tierItem);
          const tierRules = Array.isArray(prev[tierKey]) ? prev[tierKey] : [];
          return [
            tierKey,
            tierRules.map((condition) => {
              if (condition.metric === "onlineHours") return { ...condition, serviceType: "ANY" };
              if (normalizedPartnerType === "AUTO") return { ...condition, serviceType: "AUTO" };
              if (isBike) return { ...condition, serviceType: "BIKE" };
              return condition.serviceType === "AUTO" || condition.serviceType === "BIKE"
                ? { ...condition, serviceType: "RIDES" }
                : condition;
            }),
          ];
        })
      )
    );
  }, [partnerType]);

  const addCondition = (tierKey) => {
    setTierConditions((prev) => ({
      ...prev,
      [tierKey]: [...(Array.isArray(prev[tierKey]) ? prev[tierKey] : []), createCondition()],
    }));
  };

  const removeCondition = (tierKey, index) => {
    setTierConditions((prev) => ({
      ...prev,
      [tierKey]: (Array.isArray(prev[tierKey]) ? prev[tierKey] : []).filter((_, idx) => idx !== index),
    }));
  };

  const payloadBuilder = useMemo(
    () => () => ({
      // evaluation: {
      //   weekStart: evaluation.weekStart || "MONDAY",
      //   timezone: evaluation.timezone || "Asia/Kolkata",
      //   upgradeStep: Number(evaluation.upgradeStep || 1),
      //   downgradeStep: Number(evaluation.downgradeStep || 1),
      // },
      tiers: Object.fromEntries(
        TIER_KEYS.map((tierItem) => {
          const tierKey = getTierKey(tierItem);
          return [
            tierKey,
            {
              conditions: (tierConditions[tierKey] || []).map((condition) => {
                const mappedService = mapServiceDetails(
                  condition.metric === "onlineHours" ? "ANY" : condition.serviceType
                );
                return {
                  metric: condition.metric,
                  period: condition.period,
                  serviceType: mappedService.serviceType,
                  bookingType: mappedService.bookingType,
                  packageType: mappedService.packageType,
                  op: condition.op,
                  value: Number(condition.value || 0),
                  isMandatory: Boolean(condition.isMandatory),
                };
              }),
            },
          ];
        })
      ),
      // fallbackPolicy: {
      //   silverIsFloor: Boolean(fallbackPolicy.silverIsFloor),
      //   onMissingMetrics: fallbackPolicy.onMissingMetrics || "FAIL_MANDATORY",
      // },
    }),
    [evaluation, tierConditions, fallbackPolicy]
  );

  registerBuilder(payloadBuilder);

  return (
    <div className="space-y-4">
      <input type="hidden" name="silverIsFloor" value={String(fallbackPolicy.silverIsFloor)} />
      <input type="hidden" name="onMissingMetrics" value={fallbackPolicy.onMissingMetrics} />
      <input type="hidden" name="weekStart" value={evaluation.weekStart} />
      <input type="hidden" name="timezone" value={evaluation.timezone} />
      <input type="hidden" name="upgradeStep" value={String(evaluation.upgradeStep)} />
      <input type="hidden" name="downgradeStep" value={String(evaluation.downgradeStep)} />

      <Typography variant="small" color="blue-gray" className="font-semibold">Tiers</Typography>
      {TIER_KEYS.map((tierItem) => {
        const tierKey = getTierKey(tierItem);
        const tierLabel = getTierLabel(tierItem);
        return (
          <div key={tierKey} className="rounded-lg border border-blue-gray-100 p-4">
            <div className="mb-3 flex items-center justify-between">
              <Typography color="blue-gray" className="font-semibold">{tierLabel}</Typography>
              <Button type="button" size="sm" variant="outlined" color="blue" onClick={() => addCondition(tierKey)}>Add Condition</Button>
            </div>
            <div className="space-y-3">
              {(tierConditions[tierKey] || []).map((condition, index) => (
                <div key={`${tierKey}-${index}`} className="rounded-md border border-blue-gray-100 p-3">
                  <div className="mb-3 flex items-center justify-between">
                    <Typography variant="small" color="blue-gray" className="font-medium">Condition {index + 1}</Typography>
                    <Button type="button" size="sm" variant="text" color="red" onClick={() => removeCondition(tierKey, index)}>Remove</Button>
                  </div>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-6">
                    <div>
                      <Typography variant="small" color="blue-gray" className="mb-1 text-xs font-semibold">Metric</Typography>
                      <select value={condition.metric} onChange={(e) => onConditionChange(tierKey, index, "metric", e.target.value)} className="w-full rounded-md border border-blue-gray-200 bg-white px-3 py-2 text-sm text-blue-gray-700">
                        {METRIC_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Typography variant="small" color="blue-gray" className="mb-1 text-xs font-semibold">Period</Typography>
                      <select value={condition.period} onChange={(e) => onConditionChange(tierKey, index, "period", e.target.value)} className="w-full rounded-md border border-blue-gray-200 bg-white px-3 py-2 text-sm text-blue-gray-700">
                        {PERIOD_OPTIONS.map((option) => (
                          <option key={getOptionValue(option)} value={getOptionValue(option)}>{getOptionLabel(option)}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Typography variant="small" color="blue-gray" className="mb-1 text-xs font-semibold">Service Type</Typography>
                      <select
                        value={condition.serviceType}
                        onChange={(e) => onConditionChange(tierKey, index, "serviceType", e.target.value)}
                        className="w-full rounded-md border border-blue-gray-200 bg-white px-3 py-2 text-sm text-blue-gray-700"
                        disabled={condition.metric === "onlineHours" || normalizedPartnerType === "AUTO" || isBike}
                      >
                        {(condition.metric === "onlineHours"
                          ? LOCKED_SERVICE_TYPE_OPTIONS
                          : normalizedPartnerType === "AUTO"
                            ? [{ label: "Auto", value: "AUTO" }]
                            : isBike
                              ? [{ label: "Bike", value: "BIKE" }]
                              : SERVICE_TYPE_OPTIONS
                        ).map((option) => (
                          <option key={getOptionValue(option)} value={getOptionValue(option)}>{getOptionLabel(option)}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Typography variant="small" color="blue-gray" className="mb-1 text-xs font-semibold">Operator</Typography>
                      <select value={condition.op} onChange={(e) => onConditionChange(tierKey, index, "op", e.target.value)} className="w-full rounded-md border border-blue-gray-200 bg-white px-3 py-2 text-sm text-blue-gray-700">
                        {OP_OPTIONS.map((option) => (
                          <option key={getOptionValue(option)} value={getOptionValue(option)}>{getOptionLabel(option)}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Typography variant="small" color="blue-gray" className="mb-1 text-xs font-semibold">{condition.metric === "acceptancePct" ? "Value (%)" : "Value"}</Typography>
                      <input type="number" step="any" value={condition.value} onChange={(e) => onConditionChange(tierKey, index, "value", e.target.value)} className="w-full rounded-md border border-blue-gray-200 bg-white px-3 py-2 text-sm text-blue-gray-700" placeholder={condition.metric === "acceptancePct" ? "Value(%)" : "Value"} />
                    </div>
                    <div>
                      <Typography variant="small" color="blue-gray" className="mb-1 text-xs font-semibold">Mandatory</Typography>
                      <label className="inline-flex items-center gap-2 py-2">
                        <input type="checkbox" checked={condition.isMandatory} onChange={(e) => onConditionChange(tierKey, index, "isMandatory", e.target.checked)} className="h-4 w-4 rounded border-blue-gray-300" />
                        <Typography variant="small" color="blue-gray">Yes</Typography>
                      </label>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  );
}

export default TierRulesSection;
