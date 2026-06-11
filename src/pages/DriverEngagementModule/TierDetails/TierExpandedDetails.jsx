import React from "react";
import { Typography } from "@material-tailwind/react";
import {
  formatBoolLabel,
  formatLabelCase,
  formatMetricLabel,
  formatPeriodLabel,
  formatConditionServiceTypeLabel,
  formatServiceTypeLabel,
  safeText,
} from "./listFormatters";

const isLocalUnlockService = (value) => {
  const normalized = String(value || "").trim().toUpperCase();
  return normalized === "RIDES" || normalized === "LOCAL";
};

function TierExpandedDetails({ row }) {
  const config = row?.raw?.config || {};
  const components = Array.isArray(config?.components) ? config.components : [];
  const tiers = config?.tiers && typeof config.tiers === "object" ? config.tiers : {};
  const unlockRules = config?.unlockRules && typeof config.unlockRules === "object" ? config.unlockRules : {};
  const serviceAccess = config?.serviceAccess && typeof config.serviceAccess === "object" ? config.serviceAccess : {};
  const isComponentTierRule = row.type === "ONLINE_HOURS_RULES" || row.type === "SERVICE_TRIP_RULES";

  return (
    <>
      {row.type === "INCENTIVE_RULES" && (
        <div className="space-y-3">
          {components.length === 0 && (
            <Typography variant="small" color="gray">
              No components available.
            </Typography>
          )}

          {components.map((component, componentIndex) => {
            const rules = Array.isArray(component?.rules) ? component.rules : [];
            const payoutByTier =
              component?.payoutByTier && typeof component.payoutByTier === "object"
                ? component.payoutByTier
                : null;
            return (
              <div key={`${row.id}-component-${componentIndex}`} className="rounded-md border border-blue-gray-100 bg-white p-3">
                {!!payoutByTier && (
                  <div className="mb-2 flex flex-wrap gap-2">
                    {Object.keys(payoutByTier).map((tierKey) => (
                      <span
                        key={`${row.id}-${componentIndex}-payout-${tierKey}`}
                        className="rounded-full bg-blue-gray-100 px-2.5 py-1 text-xs font-semibold text-blue-gray-700"
                      >
                        {formatLabelCase(tierKey)}: {safeText(payoutByTier[tierKey], "0")}
                      </span>
                    ))}
                  </div>
                )}

                {rules.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[980px] table-auto text-left">
                      <thead>
                        <tr>
                          {["Rule #", "Amount", "Metric", "Period", "Service Type", "Operator", "Value"].map((head) => (
                            <th key={`${row.id}-${componentIndex}-${head}`} className="border-b border-blue-gray-100 px-3 py-2">
                              <Typography variant="small" className="text-[11px] font-semibold text-blue-gray-700">
                                {head}
                              </Typography>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {rules.map((rule, ruleIndex) => {
                          const condition = rule?.condition || {};
                          return (
                            <tr key={`${row.id}-${componentIndex}-rule-${ruleIndex}`}>
                              <td className="border-b border-blue-gray-100 px-3 py-2 text-xs text-blue-gray-800">{ruleIndex + 1}</td>
                              <td className="border-b border-blue-gray-100 px-3 py-2 text-xs text-blue-gray-800">{safeText(rule?.amount)}</td>
                              <td className="border-b border-blue-gray-100 px-3 py-2 text-xs text-blue-gray-800">{formatMetricLabel(condition?.metric)}</td>
                              <td className="border-b border-blue-gray-100 px-3 py-2 text-xs text-blue-gray-800">{formatPeriodLabel(condition?.period)}</td>
                              <td className="border-b border-blue-gray-100 px-3 py-2 text-xs text-blue-gray-800">{formatConditionServiceTypeLabel(condition)}</td>
                              <td className="border-b border-blue-gray-100 px-3 py-2 text-xs text-blue-gray-800">{safeText(condition?.op)}</td>
                              <td className="border-b border-blue-gray-100 px-3 py-2 text-xs text-blue-gray-800">{safeText(condition?.value)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <Typography variant="small" color="gray">
                    No rules available for this component.
                  </Typography>
                )}
              </div>
            );
          })}
        </div>
      )}

      {row.type === "TIER_RULES" && (
        <div className="space-y-3">
          {Object.keys(tiers).length === 0 && (
            <Typography variant="small" color="gray">
              No tier rules available.
            </Typography>
          )}
          {Object.keys(tiers).map((tierKey) => {
            const conditions = Array.isArray(tiers?.[tierKey]?.conditions) ? tiers[tierKey].conditions : [];
            return (
              <div key={`${row.id}-tier-${tierKey}`} className="rounded-md border border-blue-gray-100 bg-white p-3">
                <Typography variant="small" className="mb-2 text-xs font-semibold text-blue-gray-700">
                  Tier: {formatLabelCase(tierKey)}
                </Typography>
                {conditions.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[860px] table-auto text-left">
                      <thead>
                        <tr>
                          {["Condition #", "Metric", "Period", "Service Type", "Operator", "Value"].map((head) => (
                            <th key={`${row.id}-${tierKey}-${head}`} className="border-b border-blue-gray-100 px-3 py-2">
                              <Typography variant="small" className="text-[11px] font-semibold text-blue-gray-700">
                                {head}
                              </Typography>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {conditions.map((condition, conditionIndex) => (
                          <tr key={`${row.id}-${tierKey}-condition-${conditionIndex}`}>
                            <td className="border-b border-blue-gray-100 px-3 py-2 text-xs text-blue-gray-800">{conditionIndex + 1}</td>
                            <td className="border-b border-blue-gray-100 px-3 py-2 text-xs text-blue-gray-800">{formatMetricLabel(condition?.metric)}</td>
                            <td className="border-b border-blue-gray-100 px-3 py-2 text-xs text-blue-gray-800">{formatPeriodLabel(condition?.period)}</td>
                            <td className="border-b border-blue-gray-100 px-3 py-2 text-xs text-blue-gray-800">{formatConditionServiceTypeLabel(condition)}</td>
                            <td className="border-b border-blue-gray-100 px-3 py-2 text-xs text-blue-gray-800">{safeText(condition?.op)}</td>
                            <td className="border-b border-blue-gray-100 px-3 py-2 text-xs text-blue-gray-800">{safeText(condition?.value)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <Typography variant="small" color="gray">
                    No conditions configured.
                  </Typography>
                )}
              </div>
            );
          })}
        </div>
      )}

      {row.type === "DISPATCH_RULES" && (
        <div className="space-y-3">
          <div className="rounded-md border border-blue-gray-100 bg-white p-3">
            <Typography variant="small" className="mb-2 text-xs font-semibold text-blue-gray-700">
              Service Access
            </Typography>
            {Object.keys(serviceAccess).length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[780px] table-auto text-left">
                  <thead>
                    <tr>
                      {["Tier", "Service", "Access"].map((head) => (
                        <th key={`${row.id}-access-${head}`} className="border-b border-blue-gray-100 px-3 py-2">
                          <Typography variant="small" className="text-[11px] font-semibold text-blue-gray-700">
                            {head}
                          </Typography>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Object.keys(serviceAccess).flatMap((tierKey) =>
                      Object.keys(serviceAccess[tierKey] || {}).map((serviceKey) => (
                        <tr key={`${row.id}-${tierKey}-${serviceKey}`}>
                          <td className="border-b border-blue-gray-100 px-3 py-2 text-xs text-blue-gray-800">{formatLabelCase(tierKey)}</td>
                          <td className="border-b border-blue-gray-100 px-3 py-2 text-xs text-blue-gray-800">{formatServiceTypeLabel(serviceKey)}</td>
                          <td className="border-b border-blue-gray-100 px-3 py-2 text-xs text-blue-gray-800">{formatBoolLabel(serviceAccess?.[tierKey]?.[serviceKey])}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <Typography variant="small" color="gray">
                No service access configuration.
              </Typography>
            )}
          </div>

          <div className="rounded-md border border-blue-gray-100 bg-white p-3">
            <Typography variant="small" className="mb-2 text-xs font-semibold text-blue-gray-700">
              Unlock Rules
            </Typography>
            {Object.keys(unlockRules).length > 0 ? (
              Object.keys(unlockRules).map((tierKey) => {
                const tierUnlockRules = (Array.isArray(unlockRules[tierKey]) ? unlockRules[tierKey] : []).filter(
                  (rule) => !isLocalUnlockService(rule?.unlockService)
                );
                const flattenedUnlockRules = tierUnlockRules.flatMap((rule, ruleIndex) => {
                  const conditions =
                    Array.isArray(rule?.conditions) && rule.conditions.length
                      ? rule.conditions
                      : rule?.condition
                        ? [rule.condition]
                        : [];

                  if (!conditions.length) {
                    return [
                      {
                        rowKey: `${row.id}-unlock-${tierKey}-${ruleIndex}-0`,
                        ruleIndex,
                        condition: {},
                        unlockService: rule?.unlockService,
                        allowedZones: Array.isArray(rule?.allowedZones) ? rule.allowedZones : [],
                      },
                    ];
                  }

                  return conditions.map((condition, conditionIndex) => ({
                    rowKey: `${row.id}-unlock-${tierKey}-${ruleIndex}-${conditionIndex}`,
                    ruleIndex,
                    condition,
                    unlockService: rule?.unlockService,
                    allowedZones: Array.isArray(rule?.allowedZones) ? rule.allowedZones : [],
                  }));
                });
                return (
                  <div key={`${row.id}-unlock-${tierKey}`} className="mb-3">
                    <Typography variant="small" className="mb-2 text-xs font-semibold text-blue-gray-700">
                      {formatLabelCase(tierKey)}
                    </Typography>
                    {flattenedUnlockRules.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[980px] table-auto text-left">
                          <thead>
                            <tr>
                              {[
                                "Rule #",
                                "Unlock Service",
                                "Metric",
                                "Period",
                                "Service Type",
                                "Operator",
                                "Value",
                                "Mandatory",
                                "Allowed Zones",
                              ].map((head) => (
                                <th key={`${row.id}-unlock-${tierKey}-${head}`} className="border-b border-blue-gray-100 px-3 py-2">
                                  <Typography variant="small" className="text-[11px] font-semibold text-blue-gray-700">
                                    {head}
                                  </Typography>
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {flattenedUnlockRules.map((item) => {
                              const condition = item?.condition || {};
                              return (
                                <tr key={item.rowKey}>
                                  <td className="border-b border-blue-gray-100 px-3 py-2 text-xs text-blue-gray-800">{item.ruleIndex + 1}</td>
                                  <td className="border-b border-blue-gray-100 px-3 py-2 text-xs text-blue-gray-800">
                                    {formatServiceTypeLabel(item?.unlockService)}
                                  </td>
                                  <td className="border-b border-blue-gray-100 px-3 py-2 text-xs text-blue-gray-800">{formatMetricLabel(condition?.metric)}</td>
                                  <td className="border-b border-blue-gray-100 px-3 py-2 text-xs text-blue-gray-800">{formatPeriodLabel(condition?.period)}</td>
                                  <td className="border-b border-blue-gray-100 px-3 py-2 text-xs text-blue-gray-800">{formatConditionServiceTypeLabel(condition)}</td>
                                  <td className="border-b border-blue-gray-100 px-3 py-2 text-xs text-blue-gray-800">{safeText(condition?.op)}</td>
                                  <td className="border-b border-blue-gray-100 px-3 py-2 text-xs text-blue-gray-800">{safeText(condition?.value)}</td>
                                  <td className="border-b border-blue-gray-100 px-3 py-2 text-xs text-blue-gray-800">{formatBoolLabel(condition?.isMandatory)}</td>
                                  <td className="border-b border-blue-gray-100 px-3 py-2 text-xs text-blue-gray-800">
                                    {item.allowedZones.length > 0 ? item.allowedZones.join(", ") : "All"}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <Typography variant="small" color="gray">
                        No unlock rules.
                      </Typography>
                    )}
                  </div>
                );
              })
            ) : (
              <Typography variant="small" color="gray">
                No unlock rules configuration.
              </Typography>
            )}
          </div>
        </div>
      )}

      {isComponentTierRule && (
        <div className="space-y-3">
          {components.length === 0 && (
            <Typography variant="small" color="gray">
              No components available.
            </Typography>
          )}

          {components.map((component, componentIndex) => {
            const componentTiers =
              component?.tiers && typeof component.tiers === "object" ? component.tiers : {};

            return (
              <div
                key={`${row.id}-component-tier-${componentIndex}`}
                className="rounded-md border border-blue-gray-100 bg-white p-3"
              >
                <div className="mb-3 flex flex-wrap gap-2">
                  <span className="rounded-full bg-blue-gray-100 px-2.5 py-1 text-xs font-semibold text-blue-gray-700">
                    Code: {safeText(component?.code)}
                  </span>
                  <span className="rounded-full bg-blue-gray-100 px-2.5 py-1 text-xs font-semibold text-blue-gray-700">
                    Enabled: {formatBoolLabel(component?.enabled)}
                  </span>
                  <span className="rounded-full bg-blue-gray-100 px-2.5 py-1 text-xs font-semibold text-blue-gray-700">
                    Frequency: {formatPeriodLabel(component?.payoutFrequency)}
                  </span>
                  <span className="rounded-full bg-blue-gray-100 px-2.5 py-1 text-xs font-semibold text-blue-gray-700">
                    Apply Mode: {safeText(component?.applyMode)}
                  </span>
                </div>

                {Object.keys(componentTiers).length > 0 ? (
                  Object.keys(componentTiers).map((tierKey) => {
                    const tierConfig = componentTiers[tierKey] || {};
                    const rules = Array.isArray(tierConfig?.rules) ? tierConfig.rules : [];

                    return (
                      <div key={`${row.id}-${componentIndex}-${tierKey}`} className="mb-3">
                        <div className="mb-2 flex flex-wrap gap-2">
                          <span className="rounded-full bg-blue-gray-100 px-2.5 py-1 text-xs font-semibold text-blue-gray-700">
                            Tier: {formatLabelCase(tierKey)}
                          </span>
                          <span className="rounded-full bg-blue-gray-100 px-2.5 py-1 text-xs font-semibold text-blue-gray-700">
                            Enabled: {formatBoolLabel(tierConfig?.enabled)}
                          </span>
                          <span className="rounded-full bg-blue-gray-100 px-2.5 py-1 text-xs font-semibold text-blue-gray-700">
                            Frequency: {formatPeriodLabel(tierConfig?.payoutFrequency)}
                          </span>
                        </div>

                        {rules.length > 0 ? (
                          <div className="overflow-x-auto">
                            <table className="w-full min-w-[980px] table-auto text-left">
                              <thead>
                                <tr>
                                  {["Rule #", "Amount", "Metric", "Period", "Service Type", "Operator", "Value", "Mandatory"].map((head) => (
                                    <th key={`${row.id}-${componentIndex}-${tierKey}-${head}`} className="border-b border-blue-gray-100 px-3 py-2">
                                      <Typography variant="small" className="text-[11px] font-semibold text-blue-gray-700">
                                        {head}
                                      </Typography>
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {rules.map((rule, ruleIndex) => {
                                  const condition = rule?.condition || {};
                                  return (
                                    <tr key={`${row.id}-${componentIndex}-${tierKey}-${ruleIndex}`}>
                                      <td className="border-b border-blue-gray-100 px-3 py-2 text-xs text-blue-gray-800">{ruleIndex + 1}</td>
                                      <td className="border-b border-blue-gray-100 px-3 py-2 text-xs text-blue-gray-800">{safeText(rule?.amount)}</td>
                                      <td className="border-b border-blue-gray-100 px-3 py-2 text-xs text-blue-gray-800">{formatMetricLabel(condition?.metric)}</td>
                                      <td className="border-b border-blue-gray-100 px-3 py-2 text-xs text-blue-gray-800">{formatPeriodLabel(condition?.period)}</td>
                                      <td className="border-b border-blue-gray-100 px-3 py-2 text-xs text-blue-gray-800">{formatConditionServiceTypeLabel(condition)}</td>
                                      <td className="border-b border-blue-gray-100 px-3 py-2 text-xs text-blue-gray-800">{safeText(condition?.op)}</td>
                                      <td className="border-b border-blue-gray-100 px-3 py-2 text-xs text-blue-gray-800">{safeText(condition?.value)}</td>
                                      <td className="border-b border-blue-gray-100 px-3 py-2 text-xs text-blue-gray-800">{formatBoolLabel(condition?.isMandatory)}</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <Typography variant="small" color="gray">
                            No rules available for this tier.
                          </Typography>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <Typography variant="small" color="gray">
                    No tier configuration available.
                  </Typography>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

export default TierExpandedDetails;
