import {
  buildWeightLabel,
  buildWeightCode,
  createInitialParcelForm,
  defaultNightSurcharge,
  defaultOutsideDropSurcharge,
  defaultSimpleSurcharge,
  normalizeParcelVehicleType,
  toNum,
} from "./defaults";
import { Utils } from "@/utils/utils";

export const mapApiToParcelForm = (data) => {
  const form = createInitialParcelForm();
  const peakHour = Array.isArray(data?.peakHours)
    ? data.peakHours
    : (Array.isArray(data?.peakHour) ? data.peakHour : []);
  const ppRaw = data?.parcelPricing;
  const pp = Array.isArray(ppRaw) ? (ppRaw[0] || {}) : (ppRaw || {});
  const sourceWeightRows = Array.isArray(pp.weightSurcharge) && pp.weightSurcharge.length
    ? pp.weightSurcharge
    : form.parcelPricing.weightSurcharge;
  const firstWeightRow = sourceWeightRows[0] || form.parcelPricing.weightSurcharge[0];
  const parcelVehicleType = normalizeParcelVehicleType(data?.parcelVehicleType, "BIKE");

  return {
    ...form,
    zone: data?.zone || "",
    parcelVehicleType,
    subZoneId: (data?.subZoneId ? String(data.subZoneId) : ""),
    baseFare: data?.baseFare ?? "",
    baseKm: data?.baseKm ?? "",
    kilometerPrice: data?.kilometerPrice ?? "",
    waitingMins: Utils.convertTimeFormatToMinutes(data?.waitingMins) ?? "",
    waitingCharge: data?.waitingCharge ?? "",
    cancelMins: Utils.convertTimeFormatToMinutes(data?.cancelMins) ?? "",
    cancelCharge: data?.cancelCharge ?? "",
    driverCancelMins: Utils.convertTimeFormatToMinutes(data?.driverCancelMins) ?? "",
    driverFreeCancellationsPerDay: data?.driverFreeCancellationsPerDay ?? "",
    driverCancellationCharge: data?.driverCancellationCharge ?? "",
    peakHourEnabled: peakHour.length > 0,
    peakHour: peakHour.length
      ? peakHour.map((row) => ({
          start: row?.start || "",
          end: row?.end || "",
          kilometerPrice: row?.kilometerPrice ?? "",
        }))
      : form.peakHour,
    parcelPricing: {
      weightSurcharge: [{
        code: firstWeightRow?.code || "",
        minKg: firstWeightRow?.minKg ?? 0,
        maxKg: firstWeightRow?.maxKg === null ? null : (firstWeightRow?.maxKg ?? ""),
        label: firstWeightRow?.label || buildWeightLabel(firstWeightRow?.minKg ?? 0, firstWeightRow?.maxKg ?? ""),
        amount: firstWeightRow?.amount ?? 0,
      }],
      weatherSurcharge: {
        ...defaultSimpleSurcharge(),
        ...(pp.weatherSurcharge || {}),
        value: pp?.weatherSurcharge?.value ?? 0,
      },
      handlingSurcharge: {
        ...defaultSimpleSurcharge(),
        ...(pp.handlingSurcharge || {}),
        value: pp?.handlingSurcharge?.value ?? 0,
      },
      nightSurcharge: (() => {
        const night = pp?.nightSurcharge || {};
        return {
          ...defaultNightSurcharge(),
          ...night,
          start: night?.start || "22:00",
          end: night?.end || "05:00",
          value: night?.value ?? 0,
        };
      })(),
      outsideDropSurcharge: (() => {
        const outside = pp?.outsideDropSurcharge || {};
        const legacyType = outside?.type || "FLAT";
        const legacyValue = outside?.value ?? 0;
        return {
          ...defaultOutsideDropSurcharge(),
          ...outside,
          zoneToZone: {
            type: outside?.zoneToZone?.type || legacyType,
            value: outside?.zoneToZone?.value ?? legacyValue,
          },
          withoutZone: {
            type: outside?.withoutZone?.type || legacyType,
            value: outside?.withoutZone?.value ?? legacyValue,
          },
        };
      })(),
      baseFarePercent: pp?.commission?.baseFarePercent ?? pp?.baseFarePercent ?? "",
      distanceFarePercent: pp?.commission?.distanceFarePercent ?? pp?.distanceFarePercent ?? "",
    },
  };
};

export const buildParcelPayload = (form) => {
  const vehicleType = normalizeParcelVehicleType(form.parcelVehicleType, "BIKE");
  const weightRows = Array.isArray(form.parcelPricing?.weightSurcharge) && form.parcelPricing.weightSurcharge.length
    ? [form.parcelPricing.weightSurcharge[0]]
    : [];
  return {
  serviceType: 'PARCEL',
  type: 'Parcel',
  period: 'Parcel',
  parcelVehicleType: vehicleType,
  zone: form.zone,
  subZoneId: form.subZoneId,
  baseFare: toNum(form.baseFare),
  baseKm: toNum(form.baseKm),
  kilometerPrice: toNum(form.kilometerPrice),
  waitingMins: Utils.convertMinutesToTimeFormat(toNum(form.waitingMins)),
  waitingCharge: toNum(form.waitingCharge),
  cancelMins: Utils.convertMinutesToTimeFormat(toNum(form.cancelMins)),
  cancelCharge: toNum(form.cancelCharge),
  driverCancelMins: Utils.convertMinutesToTimeFormat(toNum(form.driverCancelMins)),
  driverFreeCancellationsPerDay: toNum(form.driverFreeCancellationsPerDay),
  driverCancellationCharge: toNum(form.driverCancellationCharge),
  peakHours: form.peakHourEnabled
    ? form.peakHour.map((row) => ({
        start: row.start,
        end: row.end,
        kilometerPrice: toNum(row.kilometerPrice),
      }))
    : [],
  parcelPricing: [
    {
      weightSurcharge: weightRows.map((row) => ({
        code: buildWeightCode(row.minKg, row.maxKg),
        minKg: toNum(row.minKg),
        maxKg: row.maxKg === "" || row.maxKg === null ? null : toNum(row.maxKg),
        label: row?.label || buildWeightLabel(row.minKg, row.maxKg),
        amount: toNum(row.amount),
      })),
      weatherSurcharge: {
        status: form.parcelPricing.weatherSurcharge.status,
        value: toNum(form.parcelPricing.weatherSurcharge.value),
      },
      handlingSurcharge: {
        status: form.parcelPricing.handlingSurcharge.status,
        value: toNum(form.parcelPricing.handlingSurcharge.value),
      },
      nightSurcharge: {
        status: form.parcelPricing.nightSurcharge.status,
        start: form.parcelPricing.nightSurcharge.start,
        end: form.parcelPricing.nightSurcharge.end,
        value: toNum(form.parcelPricing.nightSurcharge.value),
      },
      ...(vehicleType !== "AUTO"
        ? {
      outsideDropSurcharge: {
        status: form.parcelPricing.outsideDropSurcharge.status,
        zoneToZone: {
          type: form.parcelPricing.outsideDropSurcharge.zoneToZone.type,
          value: toNum(form.parcelPricing.outsideDropSurcharge.zoneToZone.value),
        },
        withoutZone: {
          type: form.parcelPricing.outsideDropSurcharge.withoutZone.type,
          value: toNum(form.parcelPricing.outsideDropSurcharge.withoutZone.value),
        },
      },
          }
        : {}),
      commission: {
        baseFarePercent: toNum(form.parcelPricing.baseFarePercent),
        distanceFarePercent: toNum(form.parcelPricing.distanceFarePercent),
      },
    },
  ],
};
};
