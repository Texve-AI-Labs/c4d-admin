import React, { useEffect, useMemo, useRef, useState } from "react";
import { Typography } from "@material-tailwind/react";
import { mapServiceDetails } from "../shared/ruleMappings";
import DispatchTierRuleCard from "./DispatchTierRuleCard";
import {
  BASE_DISPATCH_SERVICE_KEY,
  CONDITION_SERVICE_KEY_TO_SERVICE_TYPE,
  MIN_DISPATCH_SERVICE_ACCESS_COUNT,
  SERVICE_TYPE_TO_CONDITION_SERVICE_KEY,
  TIER_KEYS,
  createDispatchCondition,
  createDispatchUnlockConditionsByService,
  getAllowedZonesBySelectedZone,
  getConditionServiceOptions,
  mapConditionToUi,
  normalizeDispatchServiceValue,
} from "./dispatchRules.utils";

const ensureMandatoryServiceAccess = (tierAccess = {}) => ({
  ...tierAccess,
  [BASE_DISPATCH_SERVICE_KEY]: true,
});

const getSelectedAccessCount = (tierAccess = {}) =>
  Object.values(tierAccess).filter(Boolean).length;

function DispatchRulesSection({
  registerBuilder,
  serviceAreas = [],
  selectedZone = "",
  initialConfig = {},
  partnerType = "CAB",
  parcelVehicleType = "BIKE",
}) {
  const normalizedPartnerType = String(partnerType || "").trim().toUpperCase();
  const normalizedParcelVehicleType = String(parcelVehicleType || "BIKE").trim().toUpperCase();
  const isAutoPartner = normalizedPartnerType === "AUTO";
  const isBikePartner = normalizedPartnerType === "BIKE";
  const isParcelPartner = normalizedPartnerType === "PARCEL";
  const showAllowedZones = selectedZone === "ALL";
  const [dispatchServiceAccess, setDispatchServiceAccess] = useState({
    SILVER: { RIDES: true, RENTAL_DROP_ONLY: false, RENTAL_OUTSTATION: false, RENTAL_HOURLY_PACKAGE: false },
    GOLD: { RIDES: true, RENTAL_DROP_ONLY: false, RENTAL_OUTSTATION: false, RENTAL_HOURLY_PACKAGE: false },
    ELITE: { RIDES: true, RENTAL_DROP_ONLY: false, RENTAL_OUTSTATION: false, RENTAL_HOURLY_PACKAGE: false },
  });
  const [dispatchUnlockConditions, setDispatchUnlockConditions] = useState({
    SILVER: createDispatchUnlockConditionsByService(),
    GOLD: createDispatchUnlockConditionsByService(),
    ELITE: createDispatchUnlockConditionsByService(),
  });
  const [dispatchAllowedZones, setDispatchAllowedZones] = useState({
    SILVER: getAllowedZonesBySelectedZone(selectedZone),
    GOLD: getAllowedZonesBySelectedZone(selectedZone),
    ELITE: getAllowedZonesBySelectedZone(selectedZone),
  });
  const previousSelectedZoneRef = useRef(selectedZone);

  useEffect(() => {
    if (!initialConfig || typeof initialConfig !== "object") return;

    const incomingServiceAccess = initialConfig?.serviceAccess;
    if (incomingServiceAccess && typeof incomingServiceAccess === "object") {
      setDispatchServiceAccess((prev) => ({
        ...prev,
        SILVER: ensureMandatoryServiceAccess({ ...prev.SILVER, ...(incomingServiceAccess.SILVER || {}) }),
        GOLD: ensureMandatoryServiceAccess({ ...prev.GOLD, ...(incomingServiceAccess.GOLD || {}) }),
        ELITE: ensureMandatoryServiceAccess({ ...prev.ELITE, ...(incomingServiceAccess.ELITE || {}) }),
      }));
    }

    const incomingUnlockRules = initialConfig?.unlockRules;
    if (incomingUnlockRules && typeof incomingUnlockRules === "object") {
      const normalizeTierRules = (tierRules = []) => {
        const normalizedByService = {};
        let tierAllowedZones = [];

        (Array.isArray(tierRules) ? tierRules : []).forEach((rule) => {
          const unlockService = normalizeDispatchServiceValue(rule?.unlockService || "");
          if (!unlockService || unlockService === BASE_DISPATCH_SERVICE_KEY) return;
          normalizedByService[unlockService] = (Array.isArray(rule?.conditions) ? rule.conditions : []).map((condition) => ({
            metric: condition?.metric || "tripCount",
            period: condition?.period || "DAILY",
            conditionServiceKey:
              (condition?.metric || "tripCount") === "onlineHours" ? "ANY" : mapConditionToUi(condition),
            op: condition?.op || ">=",
            value: String(condition?.value ?? ""),
            isMandatory: typeof condition?.isMandatory === "boolean" ? condition.isMandatory : true,
          }));
          if (!tierAllowedZones.length) {
            tierAllowedZones = (Array.isArray(rule?.allowedZones) ? rule.allowedZones : []).filter(
              (zoneName) => zoneName && zoneName !== "ALL"
            );
          }
        });

        return { normalizedByService, tierAllowedZones };
      };

      const silverParsed = normalizeTierRules(incomingUnlockRules.SILVER);
      const goldParsed = normalizeTierRules(incomingUnlockRules.GOLD);
      const eliteParsed = normalizeTierRules(incomingUnlockRules.ELITE);

      setDispatchUnlockConditions({
        SILVER: silverParsed.normalizedByService,
        GOLD: goldParsed.normalizedByService,
        ELITE: eliteParsed.normalizedByService,
      });
      setDispatchAllowedZones({
        SILVER: silverParsed.tierAllowedZones,
        GOLD: goldParsed.tierAllowedZones,
        ELITE: eliteParsed.tierAllowedZones,
      });
    }
  }, [initialConfig]);

  const onDispatchServiceAccessChange = (tierKey, serviceKey, checked) => {
    if (serviceKey === BASE_DISPATCH_SERVICE_KEY) return;

    setDispatchServiceAccess((prev) => {
      const currentTierAccess = ensureMandatoryServiceAccess({ ...(prev[tierKey] || {}) });
      const nextTierAccess = ensureMandatoryServiceAccess({
        ...currentTierAccess,
        [serviceKey]: checked,
      });

      if (getSelectedAccessCount(nextTierAccess) < MIN_DISPATCH_SERVICE_ACCESS_COUNT) {
        return prev;
      }

      return {
        ...prev,
        [tierKey]: nextTierAccess,
      };
    });

    // Destructive behavior by design: once unchecked, clear stored conditions
    // so re-check starts with a clean slate.
    if (!checked) {
      setDispatchUnlockConditions((prev) => {
        const tierConditions = prev?.[tierKey] || {};
        if (!Object.prototype.hasOwnProperty.call(tierConditions, serviceKey)) {
          return prev;
        }
        const nextTierConditions = { ...tierConditions };
        delete nextTierConditions[serviceKey];
        return {
          ...prev,
          [tierKey]: nextTierConditions,
        };
      });
    }
  };

  const onDispatchConditionChange = (tierKey, serviceKey, index, field, nextValue) => {
    setDispatchUnlockConditions((prev) => ({
      ...prev,
      [tierKey]: {
        ...prev[tierKey],
        [serviceKey]: (prev[tierKey]?.[serviceKey] || []).map((condition, idx) =>
          idx === index
            ? field === "metric"
              ? {
                ...condition,
                metric: nextValue,
                conditionServiceKey:
                  nextValue === "onlineHours"
                    ? "ANY"
                    : condition.conditionServiceKey === "ANY"
                      ? (getConditionServiceOptions(tierKey, serviceKey, dispatchServiceAccess)[0] || "RIDES")
                      : condition.conditionServiceKey,
              }
              : { ...condition, [field]: nextValue }
            : condition
        ),
      },
    }));
  };

  const addDispatchCondition = (tierKey, serviceKey) => {
    const conditionServiceOptions = getConditionServiceOptions(tierKey, serviceKey, dispatchServiceAccess);
    setDispatchUnlockConditions((prev) => ({
      ...prev,
      [tierKey]: {
        ...prev[tierKey],
        [serviceKey]: [...(prev[tierKey]?.[serviceKey] || []), createDispatchCondition(conditionServiceOptions)],
      },
    }));
  };

  const removeDispatchCondition = (tierKey, serviceKey, index) => {
    setDispatchUnlockConditions((prev) => ({
      ...prev,
      [tierKey]: {
        ...prev[tierKey],
        [serviceKey]: (prev[tierKey]?.[serviceKey] || []).filter((_, idx) => idx !== index),
      },
    }));
  };

  const onDispatchAllowedZonesChange = (tierKey, selectedValue) => {
    setDispatchAllowedZones((prev) => {
      const current = Array.isArray(prev[tierKey]) ? prev[tierKey] : [];
      const exists = current.includes(selectedValue);
      return {
        ...prev,
        [tierKey]: exists ? current.filter((zone) => zone !== selectedValue) : [...current, selectedValue],
      };
    });
  };

  useEffect(() => {
    const normalizedZone = selectedZone || "";
    if (normalizedZone && normalizedZone !== "ALL") {
      setDispatchAllowedZones({
        SILVER: [normalizedZone],
        GOLD: [normalizedZone],
        ELITE: [normalizedZone],
      });
    } else if (previousSelectedZoneRef.current && previousSelectedZoneRef.current !== "ALL") {
      setDispatchAllowedZones({
        SILVER: [],
        GOLD: [],
        ELITE: [],
      });
    }
    previousSelectedZoneRef.current = normalizedZone;
  }, [selectedZone]);

  useEffect(() => {
    setDispatchUnlockConditions((prev) => {
      let hasChanges = false;
      const next = { ...prev };

      TIER_KEYS.forEach((tierKey) => {
        const tierConditions = prev[tierKey] || {};
        const nextTierConditions = { ...tierConditions };

        Object.entries(tierConditions).forEach(([targetServiceKey, conditions]) => {
          const conditionServiceOptions = getConditionServiceOptions(tierKey, targetServiceKey, dispatchServiceAccess);
          const fallbackConditionService = conditionServiceOptions[0] || "RIDES";

          const normalizedConditions = (Array.isArray(conditions) ? conditions : []).map((condition) => {
            if (condition?.metric === "onlineHours") {
              if (condition?.conditionServiceKey === "ANY") return condition;
              hasChanges = true;
              return {
                ...condition,
                conditionServiceKey: "ANY",
              };
            }
            const normalizedConditionServiceKey = normalizeDispatchServiceValue(condition?.conditionServiceKey || "");
            if (conditionServiceOptions.includes(normalizedConditionServiceKey)) return condition;
            hasChanges = true;
            return {
              ...condition,
              conditionServiceKey: fallbackConditionService,
            };
          });

          nextTierConditions[targetServiceKey] = normalizedConditions;
        });

        next[tierKey] = nextTierConditions;
      });

      return hasChanges ? next : prev;
    });
  }, [dispatchServiceAccess]);

  const payloadBuilder = useMemo(
    () => () => {
      if (isAutoPartner) {
        return {
          serviceAccess: {
            SILVER: { AUTO: true },
            GOLD: { AUTO: true },
            ELITE: { AUTO: true },
          },
          unlockRules: {
            SILVER: [],
            GOLD: [],
            ELITE: [],
          },
          enforcement: {
            strictMode: true,
          },
        };
      }

      if (isBikePartner) {
        return {
          serviceAccess: {
            SILVER: { BIKE: true },
            GOLD: { BIKE: true },
            ELITE: { BIKE: true },
          },
          unlockRules: {
            SILVER: [],
            GOLD: [],
            ELITE: [],
          },
          enforcement: {
            strictMode: true,
          },
        };
      }

      if (isParcelPartner) {
        return {
          parcelVehicleType: normalizedParcelVehicleType,
          serviceAccess: {
            SILVER: { [normalizedParcelVehicleType]: true },
            GOLD: { [normalizedParcelVehicleType]: true },
            ELITE: { [normalizedParcelVehicleType]: true },
          },
          unlockRules: {
            SILVER: [],
            GOLD: [],
            ELITE: [],
          },
          enforcement: {
            strictMode: true,
          },
        };
      }

      const buildTierUnlockRules = (tierKey) =>
        Object.entries(dispatchUnlockConditions[tierKey] || {})
          .filter(([serviceKey, conditions]) =>
            Boolean(dispatchServiceAccess?.[tierKey]?.[serviceKey]) &&
            serviceKey !== BASE_DISPATCH_SERVICE_KEY && Array.isArray(conditions) && conditions.length > 0
          )
          .map(([serviceKey, conditions]) => ({
            unlockService: normalizeDispatchServiceValue(serviceKey),
            allowedZones: dispatchAllowedZones[tierKey]?.length ? dispatchAllowedZones[tierKey] : [],
            conditions: conditions.map((condition) => {
              const conditionServiceKey =
                (condition.metric === "onlineHours" ? "ANY" : condition.conditionServiceKey) ||
                SERVICE_TYPE_TO_CONDITION_SERVICE_KEY[condition.serviceType] ||
                "RIDES";
              const mapped = mapServiceDetails(
                CONDITION_SERVICE_KEY_TO_SERVICE_TYPE[conditionServiceKey] || "RIDES"
              );
              return {
                metric: condition.metric,
                period: condition.period,
                serviceType: mapped.serviceType,
                bookingType: mapped.bookingType,
                packageType: mapped.packageType,
                op: condition.op,
                value: Number(condition.value || 0),
                isMandatory: Boolean(condition.isMandatory),
              };
            }),
          }));

      return {
        serviceAccess: dispatchServiceAccess,
        unlockRules: {
          SILVER: buildTierUnlockRules("SILVER"),
          GOLD: buildTierUnlockRules("GOLD"),
          ELITE: buildTierUnlockRules("ELITE"),
        },
      };
    },
    [
      dispatchServiceAccess,
      dispatchUnlockConditions,
      dispatchAllowedZones,
      isAutoPartner,
      isBikePartner,
      isParcelPartner,
      normalizedParcelVehicleType,
    ]
  );

  registerBuilder(payloadBuilder);

  if (isAutoPartner || isBikePartner || isParcelPartner) {
    return (
      <div className="space-y-4">
        {TIER_KEYS.map((tierKey) => (
          <details key={`auto-dispatch-${tierKey}`} className="rounded-lg border border-blue-gray-100 p-4" open>
            <summary className="cursor-pointer select-none text-sm font-semibold text-blue-gray-800">
              {tierKey}
            </summary>
            <div className="mt-3 space-y-3">
              <div>
                <Typography variant="small" color="blue-gray" className="mb-2 font-semibold">
                  Service Access
                </Typography>
                <label className="inline-flex items-center gap-2">
                  <input type="checkbox" checked disabled className="h-4 w-4 rounded border-blue-gray-300" />
                  <Typography variant="small" color="blue-gray">
                    {isAutoPartner ? "Auto" : isBikePartner ? "Bike" : normalizedParcelVehicleType === "AUTO" ? "Auto" : "Bike"}
                  </Typography>
                </label>
                <Typography variant="small" color="gray" className="mt-1 text-xs">
                  {isAutoPartner
                    ? "Auto is mandatory for AUTO partner."
                    : isBikePartner
                      ? "Bike is mandatory for BIKE partner."
                      : `${normalizedParcelVehicleType === "AUTO" ? "Auto" : "Bike"} is mandatory for PARCEL partner.`}
                </Typography>
              </div>
            </div>
          </details>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {TIER_KEYS.map((tierKey) => (
        <DispatchTierRuleCard
          key={`unlock-${tierKey}`}
          tierKey={tierKey}
          dispatchServiceAccess={dispatchServiceAccess}
          dispatchUnlockConditions={dispatchUnlockConditions}
          onDispatchServiceAccessChange={onDispatchServiceAccessChange}
          onDispatchConditionChange={onDispatchConditionChange}
          addDispatchCondition={addDispatchCondition}
          removeDispatchCondition={removeDispatchCondition}
          showAllowedZones={showAllowedZones}
          serviceAreas={serviceAreas}
          dispatchAllowedZones={dispatchAllowedZones}
          onDispatchAllowedZonesChange={onDispatchAllowedZonesChange}
        />
      ))}
    </div>
  );
}

export default DispatchRulesSection;
