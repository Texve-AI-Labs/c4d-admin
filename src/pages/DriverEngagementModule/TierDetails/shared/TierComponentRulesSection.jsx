import React, { useEffect, useMemo, useState } from "react";
import { Typography, Button } from "@material-tailwind/react";
import { OP_OPTIONS } from "./typeConstants";
import {
  buildComponentRuleConditionPayload,
  COMPONENT_LOCKED_ANY_SERVICE_OPTIONS,
  COMPONENT_RULE_SERVICE_OPTIONS,
  COMPONENT_TIER_KEYS,
  createComponentRuleCondition,
  createComponentRuleState,
  getComponentUiServiceType,
  isBikePartner,
} from "./componentRuleUtils";

const getOptionValue = (option) =>
  typeof option === "string" ? option : option?.value || "";

const getOptionLabel = (option) =>
  typeof option === "string" ? option : option?.label || option?.value || "";

const createEmptySlot = () => ({ start: "", end: "" });

const toMinutes = (time = "") => {
  const [hours, minutes] = String(time || "")
    .trim()
    .split(":")
    .map((part) => Number(part));
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  return hours * 60 + minutes;
};

const getSlotError = (slot = {}) => {
  const start = String(slot?.start || "").trim();
  const end = String(slot?.end || "").trim();
  if (!start || !end) return "";
  const startMinutes = toMinutes(start);
  const endMinutes = toMinutes(end);
  if (startMinutes === null || endMinutes === null) return "Invalid time format.";
  if (endMinutes <= startMinutes) return "End time must be later than start time.";
  if (endMinutes > 22 * 60) return "End time cannot be later than 22:00.";
  return "";
};

function TierComponentRulesSection({
  registerBuilder,
  initialConfig = {},
  partnerType = "CAB",
  parcelVehicleType = "BIKE",
  componentCode,
  title,
  defaultMetric,
  defaultPeriod,
  defaultServiceType,
  defaultPayoutFrequency,
  metricOptions,
  periodOptions,
  payoutFrequencyOptions = [],
  hideMetricSelector = false,
  allowMetricChange = false,
  allowPeriodChange = false,
  disableServiceType = false,
  hideMandatory = false,
  syncPeriodWithPayoutFrequency = false,
  serviceOptions = COMPONENT_RULE_SERVICE_OPTIONS,
}) {
  const normalizedPartnerType = String(partnerType || "").trim().toUpperCase();
  const normalizedParcelVehicleType = String(parcelVehicleType || "BIKE").trim().toUpperCase();
  const isBike = isBikePartner(normalizedPartnerType);
  const autoOptions = [{ label: "Auto", value: "AUTO" }];
  const bikeOptions = [{ label: "Bike", value: "BIKE" }];
  const [componentState, setComponentState] = useState(
    createComponentRuleState({
      payoutFrequency: defaultPayoutFrequency,
      enabled: true,
      applyMode: "SUM",
    })
  );

  useEffect(() => {
    if (!initialConfig || typeof initialConfig !== "object") return;
    const components = Array.isArray(initialConfig.components) ? initialConfig.components : [];
    const existingComponent = components.find((component) => component?.code === componentCode);
    if (!existingComponent) return;

    setComponentState({
      enabled: Boolean(existingComponent?.enabled),
      payoutFrequency: existingComponent?.payoutFrequency || defaultPayoutFrequency,
      applyMode: existingComponent?.applyMode || "SUM",
      tiers: Object.fromEntries(
        COMPONENT_TIER_KEYS.map((tierKey) => {
          const tierConfig = existingComponent?.tiers?.[tierKey] || {};
          const rules = Array.isArray(tierConfig?.rules) ? tierConfig.rules : [];

          return [
            tierKey,
            {
              enabled: Boolean(tierConfig?.enabled),
              payoutFrequency: tierConfig?.payoutFrequency || existingComponent?.payoutFrequency || defaultPayoutFrequency,
              rules: rules.map((rule) => {
                const condition = rule?.condition || {};
                const metric = condition?.metric || defaultMetric;
                const nextServiceType =
                  metric === "onlineHours"
                    ? "ANY"
                    : normalizedPartnerType === "AUTO"
                      ? "AUTO"
                      : normalizedPartnerType === "PARCEL"
                        ? "PARCEL"
                      : isBike
                        ? "BIKE"
                      : getComponentUiServiceType(condition);

                return createComponentRuleCondition({
                  metric,
                  period: condition?.period || defaultPeriod,
                  serviceType: nextServiceType,
                  op: condition?.op || ">=",
                  value: String(condition?.value ?? ""),
                  amount: String(rule?.amount ?? ""),
                  isMandatory:
                    typeof condition?.isMandatory === "boolean" ? condition.isMandatory : true,
                  slots: Array.isArray(condition?.slots) ? condition.slots : [],
                });
              }),
            },
          ];
        })
      ),
    });
  }, [
    componentCode,
    defaultMetric,
    defaultPeriod,
    defaultPayoutFrequency,
    initialConfig,
    partnerType,
  ]);

  useEffect(() => {
    setComponentState((prev) => ({
      ...prev,
      tiers: Object.fromEntries(
        COMPONENT_TIER_KEYS.map((tierKey) => {
          const tierConfig = prev?.tiers?.[tierKey] || {
            enabled: false,
            payoutFrequency: defaultPayoutFrequency,
            rules: [],
          };

          return [
            tierKey,
            {
              ...tierConfig,
              rules: (Array.isArray(tierConfig.rules) ? tierConfig.rules : []).map((rule) => {
                if (rule.metric === "onlineHours") return { ...rule, serviceType: "ANY" };
                if (normalizedPartnerType === "AUTO") return { ...rule, serviceType: "AUTO" };
                if (normalizedPartnerType === "PARCEL") {
                  return { ...rule, serviceType: "PARCEL", parcelVehicleType: normalizedParcelVehicleType };
                }
                if (isBike) return { ...rule, serviceType: "BIKE" };
                if (rule.serviceType === "AUTO" || rule.serviceType === "BIKE") return { ...rule, serviceType: defaultServiceType };
                return rule;
              }),
            },
          ];
        })
      ),
    }));
  }, [defaultPayoutFrequency, defaultServiceType, partnerType]);

  const onComponentChange = (field, nextValue) => {
    setComponentState((prev) => ({ ...prev, [field]: nextValue }));
  };

  useEffect(() => {
    if (!syncPeriodWithPayoutFrequency) return;

    const nextPeriod = componentState?.payoutFrequency || defaultPayoutFrequency;

    setComponentState((prev) => ({
      ...prev,
      tiers: Object.fromEntries(
        COMPONENT_TIER_KEYS.map((tierKey) => {
          const tierConfig = prev?.tiers?.[tierKey] || {
            enabled: false,
            payoutFrequency: nextPeriod,
            rules: [],
          };

          return [
            tierKey,
            {
              ...tierConfig,
              rules: (Array.isArray(tierConfig.rules) ? tierConfig.rules : []).map((rule) => {
                if (!rule?.metric) return rule;
                return {
                  ...rule,
                  period: nextPeriod,
                };
              }),
            },
          ];
        })
      ),
    }));
  }, [componentState?.payoutFrequency, defaultPayoutFrequency, syncPeriodWithPayoutFrequency]);

  useEffect(() => {
    setComponentState((prev) => {
      const nextPayoutFrequency = prev?.payoutFrequency || defaultPayoutFrequency;

      return {
        ...prev,
        tiers: Object.fromEntries(
          COMPONENT_TIER_KEYS.map((tierKey) => {
            const tierConfig = prev?.tiers?.[tierKey] || {
              enabled: false,
              payoutFrequency: nextPayoutFrequency,
              rules: [],
            };

            return [
              tierKey,
              {
                ...tierConfig,
                payoutFrequency: nextPayoutFrequency,
              },
            ];
          })
        ),
      };
    });
  }, [componentState?.payoutFrequency, defaultPayoutFrequency]);

  const onTierChange = (tierKey, field, nextValue) => {
    setComponentState((prev) => ({
      ...prev,
      tiers: {
        ...prev.tiers,
        [tierKey]: {
          ...(prev.tiers?.[tierKey] || {}),
          [field]: nextValue,
        },
      },
    }));
  };

  const onRuleChange = (tierKey, index, field, nextValue) => {
    setComponentState((prev) => ({
      ...prev,
      tiers: {
        ...prev.tiers,
        [tierKey]: {
          ...(prev.tiers?.[tierKey] || {}),
          rules: (prev.tiers?.[tierKey]?.rules || []).map((rule, ruleIndex) =>
            ruleIndex === index
              ? field === "metric"
                ? {
                    ...rule,
                    metric: nextValue,
                    serviceType:
                      nextValue === "onlineHours"
                        ? "ANY"
                        : normalizedPartnerType === "AUTO"
                          ? "AUTO"
                          : normalizedPartnerType === "PARCEL"
                            ? "PARCEL"
                          : isBike
                            ? "BIKE"
                          : rule.serviceType === "ANY" || rule.serviceType === "AUTO"
                            ? defaultServiceType
                            : rule.serviceType,
                  }
                : { ...rule, [field]: nextValue }
              : rule
          ),
        },
      },
    }));
  };

  const addRule = (tierKey) => {
    setComponentState((prev) => ({
      ...prev,
      payoutFrequency: prev?.payoutFrequency || defaultPayoutFrequency,
      tiers: {
        ...prev.tiers,
        [tierKey]: {
          ...(prev.tiers?.[tierKey] || {}),
          rules: [
            ...(prev.tiers?.[tierKey]?.rules || []),
            createComponentRuleCondition({
              metric: defaultMetric,
              period: prev?.payoutFrequency || defaultPayoutFrequency || defaultPeriod,
              serviceType:
                normalizedPartnerType === "AUTO"
                  ? "AUTO"
                  : normalizedPartnerType === "PARCEL"
                    ? "PARCEL"
                    : isBike
                      ? "BIKE"
                      : defaultServiceType,
              op: ">=",
              value: "1",
              amount: "0",
              slots: defaultMetric === "onlineHours" ? [createEmptySlot()] : [],
            }),
          ],
        },
      },
    }));
  };

  const removeRule = (tierKey, index) => {
    setComponentState((prev) => ({
      ...prev,
      tiers: {
        ...prev.tiers,
        [tierKey]: {
          ...(prev.tiers?.[tierKey] || {}),
          rules: (prev.tiers?.[tierKey]?.rules || []).filter((_, ruleIndex) => ruleIndex !== index),
        },
      },
    }));
  };

  const payloadBuilder = useMemo(
    () => () => ({
      components: [
        {
          code: componentCode,
          enabled: Boolean(componentState.enabled),
          payoutFrequency: componentState.payoutFrequency || defaultPayoutFrequency,
          applyMode: componentState.applyMode || "SUM",
          parcelVehicleType: normalizedPartnerType === "PARCEL" ? normalizedParcelVehicleType : null,
          tiers: Object.fromEntries(
            COMPONENT_TIER_KEYS.map((tierKey) => {
              const tierConfig = componentState?.tiers?.[tierKey] || {};

              return [
                tierKey,
                {
                  enabled: Boolean(tierConfig?.enabled),
                  payoutFrequency: tierConfig?.payoutFrequency || componentState.payoutFrequency || defaultPayoutFrequency,
                  rules: (Array.isArray(tierConfig?.rules) ? tierConfig.rules : []).map((rule) => {
                    const mappedCondition = buildComponentRuleConditionPayload({
                      ...rule,
                      serviceType:
                        rule?.metric === "onlineHours"
                          ? "ANY"
                          : normalizedPartnerType === "AUTO"
                            ? "AUTO"
                            : normalizedPartnerType === "PARCEL"
                              ? "PARCEL"
                            : isBike
                              ? "BIKE"
                              : rule?.serviceType,
                    });

                    return {
                      amount: Number(rule?.amount || 0),
                      condition: {
                        op: rule?.op || ">=",
                        value: Number(rule?.value || 0),
                        metric: rule?.metric || defaultMetric,
                        period: rule?.period || defaultPeriod,
                        isMandatory: Boolean(rule?.isMandatory),
                        bookingType: mappedCondition.bookingType,
                        packageType: mappedCondition.packageType,
                        serviceType: mappedCondition.serviceType,
                        parcelVehicleType:
                          normalizedPartnerType === "PARCEL" ? normalizedParcelVehicleType : null,
                        slots: Array.isArray(mappedCondition.slots) ? mappedCondition.slots : undefined,
                      },
                    };
                  }),
                },
              ];
            })
          ),
        },
      ],
    }),
    [
      componentCode,
      componentState,
      defaultMetric,
      defaultPeriod,
      defaultPayoutFrequency,
      partnerType,
      normalizedPartnerType,
      normalizedParcelVehicleType,
    ]
  );

  registerBuilder(payloadBuilder);

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-blue-gray-100 p-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <label className="items-center gap-2 hidden">
            <input
              type="checkbox"
              checked={componentState.enabled}
              onChange={(event) => onComponentChange("enabled", event.target.checked)}
              className="h-4 w-4 rounded border-blue-gray-300"
            />
            <Typography variant="small" color="blue-gray" className="font-semibold">
              {title} Enabled
            </Typography>
          </label>
          
          <div>
            <Typography variant="small" color="blue-gray" className="mb-1 text-xs font-semibold">
              Payout Frequency check
            </Typography>
            <select
              value={componentState.payoutFrequency}
              onChange={(event) => onComponentChange("payoutFrequency", event.target.value)}
              className="w-full rounded-md border border-blue-gray-200 bg-white px-3 py-2 text-sm text-blue-gray-700"
            >
              {payoutFrequencyOptions.map((option) => (
                <option key={getOptionValue(option)} value={getOptionValue(option)}>
                  {getOptionLabel(option)}
                </option>
              ))}
            </select>
          </div>
          {/* <div>
            <Typography variant="small" color="blue-gray" className="mb-1 text-xs font-semibold">
              Apply Mode
            </Typography>
            <input
              value={componentState.applyMode}
              disabled
              className="w-full rounded-md border border-blue-gray-200 bg-blue-gray-50 px-3 py-2 text-sm text-blue-gray-700"
            />
          </div> */}
        </div>
      </div>

      {COMPONENT_TIER_KEYS.map((tierKey) => {
        const tierConfig = componentState?.tiers?.[tierKey] || {
          enabled: false,
          payoutFrequency: defaultPayoutFrequency,
          rules: [],
        };

        return (
          <div key={`${componentCode}-${tierKey}`} className="rounded-lg border border-blue-gray-100 p-4">
            <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <Typography color="blue-gray" className="font-semibold">
                  {tierKey}
                </Typography>
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={tierConfig.enabled}
                    onChange={(event) => onTierChange(tierKey, "enabled", event.target.checked)}
                    className="h-4 w-4 rounded border-blue-gray-300"
                  />
                  <Typography variant="small" color="blue-gray">
                    Enabled <span className=" text-red-500">*</span>
                  </Typography>
                </label>
              </div>
              <div className="flex items-center gap-3">
                <div className="min-w-[180px] hidden">
                  <Typography variant="small" color="blue-gray" className="mb-1 text-xs font-semibold">
                    Tier Payout Frequency
                  </Typography>
                  <select
                    value={tierConfig.payoutFrequency}
                    disabled
                    className="w-full rounded-md border border-blue-gray-200 bg-blue-gray-50 px-3 py-2 text-sm text-blue-gray-700"
                  >
                    {payoutFrequencyOptions.map((option) => (
                      <option key={getOptionValue(option)} value={getOptionValue(option)}>
                        {getOptionLabel(option)}
                      </option>
                    ))}
                  </select>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outlined"
                  color="blue"
                  disabled={!tierConfig.enabled}
                  onClick={() => addRule(tierKey)}
                >
                  Add Rule
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              {(tierConfig.rules || []).map((rule, index) => {
                const currentServiceOptions =
                  rule.metric === "onlineHours"
                    ? COMPONENT_LOCKED_ANY_SERVICE_OPTIONS
                          : normalizedPartnerType === "AUTO"
                            ? autoOptions
                            : isBike
                              ? bikeOptions
                              : serviceOptions;

                return (
                  <div key={`${tierKey}-${index}`} className="rounded-md border border-blue-gray-100 p-3">
                    <div className="mb-3 flex items-center justify-between">
                      <Typography variant="small" color="blue-gray" className="font-medium">
                        Rule {index + 1}
                      </Typography>
                      <Button
                        type="button"
                        size="sm"
                        variant="text"
                        color="red"
                        onClick={() => removeRule(tierKey, index)}
                      >
                        Remove
                      </Button>
                    </div>
                    <div className={`grid grid-cols-1 gap-3 ${hideMetricSelector ? "md:grid-cols-6" : "md:grid-cols-7"}`}>
                      {!hideMetricSelector && (
                        <div>
                          <Typography variant="small" color="blue-gray" className="mb-1 text-xs font-semibold">
                            Metric
                          </Typography>
                          <select
                            value={rule.metric}
                            disabled={!allowMetricChange}
                            onChange={(event) => onRuleChange(tierKey, index, "metric", event.target.value)}
                            className="w-full rounded-md border border-blue-gray-200 bg-white px-3 py-2 text-sm text-blue-gray-700 disabled:bg-blue-gray-50"
                          >
                            {metricOptions.map((option) => (
                              <option key={getOptionValue(option)} value={getOptionValue(option)}>
                                {getOptionLabel(option)}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                      <div className="hidden">
                        <Typography variant="small" color="blue-gray" className="mb-1 text-xs font-semibold">
                          Period
                        </Typography>
                        <select
                          value={rule.period}
                          disabled
                          onChange={(event) => onRuleChange(tierKey, index, "period", event.target.value)}
                          className="w-full rounded-md border border-blue-gray-200 bg-blue-gray-50 px-3 py-2 text-sm text-blue-gray-700"
                        >
                          {periodOptions.map((option) => (
                            <option key={getOptionValue(option)} value={getOptionValue(option)}>
                              {getOptionLabel(option)}
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
                          disabled={disableServiceType || rule.metric === "onlineHours" || normalizedPartnerType === "AUTO" || isBike}
                          onChange={(event) => onRuleChange(tierKey, index, "serviceType", event.target.value)}
                          className="w-full rounded-md border border-blue-gray-200 bg-white px-3 py-2 text-sm text-blue-gray-700 disabled:bg-blue-gray-50"
                        >
                          {currentServiceOptions.map((option) => (
                            <option key={getOptionValue(option)} value={getOptionValue(option)}>
                              {getOptionLabel(option)}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <Typography variant="small" color="blue-gray" className="mb-1 text-xs font-semibold">
                          Operator
                        </Typography>
                        <select
                          value={rule.op}
                          onChange={(event) => onRuleChange(tierKey, index, "op", event.target.value)}
                          className="w-full rounded-md border border-blue-gray-200 bg-white px-3 py-2 text-sm text-blue-gray-700"
                        >
                          {OP_OPTIONS.map((option) => (
                            <option key={getOptionValue(option)} value={getOptionValue(option)}>
                              {getOptionLabel(option)}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <Typography variant="small" color="blue-gray" className="mb-1 text-xs font-semibold">
                          Value
                        </Typography>
                        <input
                          type="number"
                          step="any"
                          value={rule.value}
                          onChange={(event) => onRuleChange(tierKey, index, "value", event.target.value)}
                          className="w-full rounded-md border border-blue-gray-200 bg-white px-3 py-2 text-sm text-blue-gray-700"
                          placeholder="Value"
                        />
                      </div>
                      <div>
                        <Typography variant="small" color="blue-gray" className="mb-1 text-xs font-semibold">
                          Amount
                        </Typography>
                        <input
                          type="number"
                          step="any"
                          value={rule.amount}
                          onChange={(event) => onRuleChange(tierKey, index, "amount", event.target.value)}
                          className="w-full rounded-md border border-blue-gray-200 bg-white px-3 py-2 text-sm text-blue-gray-700"
                          placeholder="Amount"
                        />
                      </div>
                      <div className={hideMandatory ? "hidden" : ""}>
                        <Typography variant="small" color="blue-gray" className="mb-1 text-xs font-semibold">
                          Mandatory
                        </Typography>
                        <label className="inline-flex items-center gap-2 py-2">
                          <input
                            type="checkbox"
                            checked={rule.isMandatory}
                            onChange={(event) => onRuleChange(tierKey, index, "isMandatory", event.target.checked)}
                            className="h-4 w-4 rounded border-blue-gray-300"
                          />
                          <Typography variant="small" color="blue-gray">
                            Yes
                          </Typography>
                        </label>
                      </div>
                    </div>

                    {rule.metric === "onlineHours" && (
                      <div className="mt-4 rounded-md border border-dashed border-blue-gray-200 bg-blue-gray-50/40 p-3">
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <div>
                            <Typography variant="small" color="blue-gray" className="font-semibold">
                              Slots
                            </Typography>
                            
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant="outlined"
                            color="blue"
                            onClick={() =>
                              onRuleChange(
                                tierKey,
                                index,
                                "slots",
                                [...(Array.isArray(rule.slots) ? rule.slots : []), createEmptySlot()]
                              )
                            }
                          >
                            Add Slot
                          </Button>
                        </div>

                        <div className="space-y-3">
                          {(Array.isArray(rule.slots) && rule.slots.length ? rule.slots : [createEmptySlot()]).map(
                            (slot, slotIndex) => (
                              <div
                                key={`${tierKey}-${index}-slot-${slotIndex}`}
                                className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr_auto]"
                              >
                                <div>
                                  <Typography variant="small" color="blue-gray" className="mb-1 text-xs font-semibold">
                                    Start
                                  </Typography>
                                  <input
                                    type="time"
                                    value={slot?.start || ""}
                                    onChange={(event) => {
                                      const currentSlots = Array.isArray(rule.slots) && rule.slots.length
                                        ? rule.slots
                                        : [createEmptySlot()];
                                      const nextSlots = currentSlots.map((currentSlot, currentIndex) =>
                                        currentIndex === slotIndex
                                          ? { ...currentSlot, start: event.target.value }
                                          : currentSlot
                                      );
                                      onRuleChange(tierKey, index, "slots", nextSlots);
                                    }}
                                    className="w-full rounded-md border border-blue-gray-200 bg-white px-3 py-2 text-sm text-blue-gray-700"
                                  />
                                  {getSlotError(slot) && (
                                    <Typography variant="small" color="red" className="mt-1 text-xs">
                                      {getSlotError(slot)}
                                    </Typography>
                                  )}
                                </div>
                                <div>
                                  <Typography variant="small" color="blue-gray" className="mb-1 text-xs font-semibold">
                                    End
                                  </Typography>
                                  <input
                                    type="time"
                                    value={slot?.end || ""}
                                    onChange={(event) => {
                                      const currentSlots = Array.isArray(rule.slots) && rule.slots.length
                                        ? rule.slots
                                        : [createEmptySlot()];
                                      const nextSlots = currentSlots.map((currentSlot, currentIndex) =>
                                        currentIndex === slotIndex
                                          ? { ...currentSlot, end: event.target.value }
                                          : currentSlot
                                      );
                                      onRuleChange(tierKey, index, "slots", nextSlots);
                                    }}
                                    className="w-full rounded-md border border-blue-gray-200 bg-white px-3 py-2 text-sm text-blue-gray-700"
                                  />
                                 
                                </div>
                                <div className="flex items-end">
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="text"
                                    color="red"
                                    disabled={(Array.isArray(rule.slots) ? rule.slots.length : 0) <= 1}
                                    onClick={() => {
                                      const currentSlots = Array.isArray(rule.slots) && rule.slots.length
                                        ? rule.slots
                                        : [createEmptySlot()];
                                      const nextSlots = currentSlots.filter((_, currentIndex) => currentIndex !== slotIndex);
                                      onRuleChange(tierKey, index, "slots", nextSlots.length ? nextSlots : [createEmptySlot()]);
                                    }}
                                  >
                                    Remove
                                  </Button>
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {tierConfig.rules.length === 0 && (
                <Typography variant="small" color="gray">
                  No rules configured for {tierKey}.
                </Typography>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default TierComponentRulesSection;
