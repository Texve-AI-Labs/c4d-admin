import { useState, useEffect } from "react";
import { Card, CardBody, Typography } from "@material-tailwind/react";
import moment from "moment";
import { API_ROUTES } from "@/utils/constants";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { Utils } from "@/utils/utils";

const MasterPriceLogParcel = ({ id }) => {
  const [documentslogs, setDocumentLogs] = useState([]);
  const sortedLogs = [...documentslogs].sort((a, b) => {
    const aTime = new Date(a?.created_at || 0).getTime();
    const bTime = new Date(b?.created_at || 0).getTime();
    if (aTime !== bTime) return bTime - aTime;
    return Number(b?.id || 0) - Number(a?.id || 0);
  });

  const masterPriceTableLogParcel = async (id) => {
    try {
      const data = await ApiRequestUtils.get(API_ROUTES.MASTERPRICETABLE_LOG + id);
      setDocumentLogs(data?.data || []);
    } catch (error) {
      console.error("Error fetching log", error);
    }
  };

  useEffect(() => {
    if (id) masterPriceTableLogParcel(id);
  }, [id]);

  const fieldMappings = {
    zone: "Zone",
    serviceType: "Service Type",
    type: "Type",
    period: "Period",
    subZoneId: "Sub Zone",
    parcelType: "Parcel Type",
    baseFare: "Base Fare",
    baseKm: "Base Km",
    kilometerPrice: "Kilometer Price",
    peakHour: "Peak Hour",
    peakHours: "Peak Hours",
    parcelPricing: "Parcel Pricing",
    pickupFreeKm: "Pickup Free Km",
    nightCharge: "Night Charge",
    nightHoursFrom: "Night Hours From",
    nightHoursTo: "Night Hours To",

    distanceSlabs: "Distance Slabs",
    weightSurcharge: "Weight Surcharge",
    peakSurcharge: "Peak Surcharge",
    nightSurcharge: "Night Surcharge",
    outsideDropSurcharge: "Outside Drop Surcharge",
    weatherSurcharge: "Weather Surcharge",
    handlingSurcharge: "Handling Surcharge",
    commission: "Commission",
    baseFarePercent: "Base Fare Percent",
    distanceFarePercent: "Distance Fare Percent",
    driverCancelMins: "Driver Cancel Mins",
    driverFreeCancellationsPerDay: "Driver Free Cancellations / Day",
    driverCancellationCharge: "Driver Cancellation Charge",
    driver_cancel_mins: "Driver Cancel Mins",
    driver_free_cancellations_per_day: "Driver Free Cancellations / Day",
    driver_cancellation_charge: "Driver Cancellation Charge",
    demandRules: "Demand Rules",
    demand_rules: "Demand Rules",
  };

  const canonicalField = (field) => {
    const key = String(field || "");
    const lower = key.toLowerCase();
    const aliasMap = {
      servicetype: "serviceType",
      service_type: "serviceType",
      base_fare: "baseFare",
      basefare: "baseFare",
      base_km: "baseKm",
      basekm: "baseKm",
      kilometer_price: "kilometerPrice",
      kilometerprice: "kilometerPrice",
      peak_hour: "peakHour",
      peakhours: "peakHours",
      peak_hours: "peakHours",
      parcel_pricing: "parcelPricing",
      parcelpricing: "parcelPricing",
      weight_surcharge: "weightSurcharge",
      weathersurcharge: "weatherSurcharge",
      weather_surcharge: "weatherSurcharge",
      handlingsurcharge: "handlingSurcharge",
      handling_surcharge: "handlingSurcharge",
      nightsurcharge: "nightSurcharge",
      night_surcharge: "nightSurcharge",
      outsidedropsurcharge: "outsideDropSurcharge",
      outside_drop_surcharge: "outsideDropSurcharge",
      driver_cancel_mins: "driverCancelMins",
      drivercancelmins: "driverCancelMins",
      driver_free_cancellations_per_day: "driverFreeCancellationsPerDay",
      driverfreecancellationsperday: "driverFreeCancellationsPerDay",
      driver_cancellation_charge: "driverCancellationCharge",
      drivercancellationcharge: "driverCancellationCharge",
      demand_rules: "demandRules",
      demandrules: "demandRules",
    };
    return aliasMap[lower] || key;
  };


  const formatArray = (arr) => {
    if (!Array.isArray(arr) || arr.length === 0) return "-";
    return arr
      .map((item) => {
        if (typeof item === "object" && item !== null) {
          return JSON.stringify(item);
        }
        return String(item);
      })
      .join(" | ");
  };

  const formatDistanceSlabs = (slabs) => {
    if (!Array.isArray(slabs) || slabs.length === 0) return "-";
    return slabs
      .map((s) => {
        const max = s.maxKm === null ? "∞" : s.maxKm;
        return `≤ ${max} km → ₹${s.ratePerKm}/km`;
      })
      .join(", ");
  };

  const formatWeightSurcharge = (arr) => {
    if (!Array.isArray(arr) || arr.length === 0) return "-";
    return arr
      .map((w) => {
        const min = Number(w?.minKg ?? 0);
        const max = w?.maxKg === null || w?.maxKg === "" ? "+" : Number(w?.maxKg ?? 0);
        return `${min}${max === "+" ? "+" : `-${max}`}kg: ${Number(w?.amount ?? 0)}`;
      })
      .join(" | ");
  };

  const formatPeakHour = (arr) => {
    if (!Array.isArray(arr) || arr.length === 0) return "-";
    return arr
      .map((p) => {
        const mini = p?.kilometerPrice ?? p?.kilometerPriceMini ?? p?.price ?? 0;
        const muv = p?.kilometerPriceMVP ?? p?.kilometerPriceMuv ?? p?.kilometerPriceMVP ?? null;
        const suv = p?.kilometerPriceSuv ?? null;
        const sedan = p?.kilometerPriceSedan ?? null;
        const extra = [
          `Mini: ${Number(mini ?? 0)}`,
          muv !== null && muv !== undefined ? `MUV: ${Number(muv)}` : null,
          suv !== null && suv !== undefined ? `SUV: ${Number(suv)}` : null,
          sedan !== null && sedan !== undefined ? `Sedan: ${Number(sedan)}` : null,
        ].filter(Boolean).join(", ");
        return `${p?.start || "00:00"}-${p?.end || "00:00"} (${extra})`;
      })
      .join(" | ");
  };

  const formatOutsideDropSurcharge = (obj) => {
    if (!obj || typeof obj !== "object") return "-";
    const status = obj.status || "INACTIVE";
    if (obj.zoneToZone || obj.withoutZone) {
      const zoneToZone = obj.zoneToZone || {};
      const withoutZone = obj.withoutZone || {};
      return `${status} | zoneToZone: ${zoneToZone.type || "FLAT"} / ${Number(zoneToZone.value ?? 0)} | withoutZone: ${withoutZone.type || "FLAT"} / ${Number(withoutZone.value ?? 0)}`;
    }
    return `${status} / ${obj.type || "FLAT"} / ${Number(obj.value ?? 0)}`;
  };

  const formatNightSurcharge = (obj) => {
    if (!obj || typeof obj !== "object") return "-";
    const status = obj.status || "INACTIVE";
    const hasTimeWindow = obj.start || obj.end;
    if (hasTimeWindow) {
      return `${status} | ${obj.start || "00:00"}-${obj.end || "00:00"} | ${Number(obj.value ?? 0)}`;
    }
    return `${status} / ${obj.type || "FLAT"} / ${Number(obj.value ?? 0)}`;
  };

  const formatSurchargeObject = (obj) => {
    if (!obj || typeof obj !== "object") return "-";
    return `${obj.status || "INACTIVE"} / ${obj.type || "FLAT"} / ${Number(obj.value ?? 0)}`;
  };

  const formatParcelPricing = (pricingRaw) => {
    const obj = Array.isArray(pricingRaw) ? (pricingRaw[0] || {}) : pricingRaw;
    if (!obj || typeof obj !== "object") return "-";
    const commission = obj.commission && typeof obj.commission === "object" ? obj.commission : {};
    const baseFarePercent = commission.baseFarePercent ?? obj.baseFarePercent ?? 0;
    const distanceFarePercent = commission.distanceFarePercent ?? obj.distanceFarePercent ?? 0;

    return [
      `weight: ${formatWeightSurcharge(obj.weightSurcharge)}`,
      `weather: ${formatSurchargeObject(obj.weatherSurcharge)}`,
      `handling: ${formatSurchargeObject(obj.handlingSurcharge)}`,
      `night: ${formatNightSurcharge(obj.nightSurcharge)}`,
      `outsideDrop: ${formatOutsideDropSurcharge(obj.outsideDropSurcharge)}`,
      `baseFare%: ${Number(baseFarePercent)}`,
      `distanceFare%: ${Number(distanceFarePercent)}`,
    ].join(" | ");
  };

  const formatPeakHours = (value) => {
    if (!Array.isArray(value) || !value.length) return "-";
    return formatPeakHour(value);
  };

  const formatPeakSurcharge = (arr) => formatArray(arr);
  const formatWeatherSurcharge = (arr) => Array.isArray(arr) ? formatArray(arr) : formatSurchargeObject(arr);
  const formatHandlingSurcharge = (arr) => Array.isArray(arr) ? formatArray(arr) : formatSurchargeObject(arr);
  const formatDemandRules = (rulesRaw) => {
    const rules = Array.isArray(rulesRaw) ? rulesRaw : [];
    if (!rules.length) return "-";
    return rules
      .map((rule) => {
        const name = rule?.name || "Rule";
        const mode = rule?.pricingMode || "-";
        const value = rule?.value ?? "-";
        const priority = rule?.priority ?? "-";
        const active = rule?.isActive ? "Active" : "Inactive";
        return `${name} (${mode}: ${value}, priority: ${priority}, ${active})`;
      })
      .join(" | ");
  };

  const formatValue = (field, value) => {
    if (value === null || value === undefined || value === "") return "-";

    const canonical = canonicalField(field);
    const lower = canonical.toLowerCase();

    if (lower.includes("distanceslabs")) return formatDistanceSlabs(value);
    if (lower.includes("weightsurcharge")) return formatWeightSurcharge(value);
    if (lower.includes("peakhour")) return formatPeakHour(value);
    if (lower.includes("peakhours")) return formatPeakHour(value);
    if (lower.includes("peaksurcharge")) return formatPeakSurcharge(value);
    if (lower.includes("nightsurcharge")) return formatNightSurcharge(value);
    if (lower.includes("outsidedropsurcharge")) return formatOutsideDropSurcharge(value);
    if (lower.includes("weathersurcharge")) return formatWeatherSurcharge(value);
    if (lower.includes("handlingsurcharge")) return formatHandlingSurcharge(value);
    if (lower.includes("parcelpricing")) return formatParcelPricing(value);
    if (lower === "demandrules" || lower === "demand_rules") return formatDemandRules(value);
    if (lower === "drivercancelmins" || lower === "driver_cancel_mins") {
      return Utils.convertTimeFormatToMinutes(value);
    }
    if (lower === "serviceType".toLowerCase()) return String(value);

    if (Array.isArray(value)) return formatArray(value);
    if (typeof value === "object") return JSON.stringify(value);

    return String(value);
  };


  return (
    <>
      <div className="flex flex-row justify-between px-2 mb-2 mt-4">
        <h2 className="text-2xl font-bold mb-4">Log</h2>
      </div>

      <Card>
        {sortedLogs.length > 0 ? (
          <CardBody className="overflow-x-auto px-0 pt-0 pb-2">
            <table className="w-full min-w-[640px] table-auto">
              <thead>
                <tr>
                  {[
                    "Log ID",
                    "Created At",
                    "Field",
                    "Previous",
                    "New",
                    "User",
                  ].map((h, i) => (
                    <th
                      key={i}
                      className="border-b border-blue-gray-50 py-3 px-5 text-left"
                    >
                      <Typography
                        variant="small"
                        className="text-[11px] font-bold uppercase text-blue-gray-700"
                      >
                        {h}
                      </Typography>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {sortedLogs.map(
                  ({ id, created_at, oldData, newData, UserId, userId, user_id, User }, logIdx) => {
                    const className = `py-3 px-5 ${
                      logIdx === sortedLogs.length - 1
                        ? ""
                        : "border-b border-blue-gray-50"
                    }`;

                    const changed = Array.from(
                      new Set([
                        ...Object.keys(oldData ?? {}),
                        ...Object.keys(newData ?? {}),
                      ])
                    ).filter((field) => {
                      const canonical = canonicalField(field);
                      const oldVal = oldData?.[field] ?? oldData?.[canonical];
                      const newVal = newData?.[field] ?? newData?.[canonical];
                      return JSON.stringify(oldVal ?? null) !== JSON.stringify(newVal ?? null);
                    });

                    return changed.map((field, fieldIdx) => (
                      <tr key={`${id}-${field}-${fieldIdx}`}>
                        <td className={className}>
                          <Typography className="text-xs font-semibold text-blue-gray-600">
                            {id}
                          </Typography>
                        </td>

                        <td className={className}>
                          <Typography className="text-xs font-semibold text-blue-gray-600">
                            {moment(created_at).format("DD-MM-YYYY HH:mm:ss")}
                          </Typography>
                        </td>

                        <td className={className}>
                          <Typography className="text-xs font-semibold text-blue-gray-600">
                            {fieldMappings[field] || fieldMappings[canonicalField(field)] || canonicalField(field)}
                          </Typography>
                        </td>

                        <td className={className}>
                          <Typography className="text-xs font-semibold text-blue-gray-600">
                            {formatValue(field, oldData?.[field] ?? oldData?.[canonicalField(field)])}
                          </Typography>
                        </td>

                        <td className={className}>
                          <Typography className="text-xs font-semibold text-blue-gray-600">
                            {formatValue(field, newData?.[field] ?? newData?.[canonicalField(field)])}
                          </Typography>
                        </td>

                        <td className={className}>
                          <Typography className="text-xs font-semibold text-blue-gray-600">
                            {User?.name ?? UserId ?? userId ?? user_id ?? "-"}
                          </Typography>
                        </td>
                      </tr>
                    ));
                  }
                )}
              </tbody>
            </table>
          </CardBody>
        ) : (
          <h2 className="text-lg font-medium p-4">No Logs</h2>
        )}
      </Card>
    </>
  );
};

export default MasterPriceLogParcel;
