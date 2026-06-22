import { normalizeParcelVehicleType, toNum } from "./defaults";

export const validateParcelForm = (form) => {
  const vehicleType = normalizeParcelVehicleType(form.parcelVehicleType, "BIKE");
  if (!form.zone) return "Zone is required";
  if (vehicleType !== "AUTO" && !form.subZoneId) return "Sub Zone is required";
  if (toNum(form.baseFare) <= 0) return "Base Fare must be greater than 0";
  if (toNum(form.baseKm) < 0) return "Base Km cannot be negative";
  if (toNum(form.kilometerPrice) <= 0) return "Kilometer Price must be greater than 0";
  if (toNum(form.cancelMins) < 0) return "Cancellation Mins cannot be negative";
  if (toNum(form.cancelCharge) < 0) return "Cancellation Charge cannot be negative";
  if (toNum(form.driverCancelMins) < 0) return "Driver Cancel Mins cannot be negative";
  if (toNum(form.driverFreeCancellationsPerDay) < 0) return "Driver Free Cancellations Per Day cannot be negative";
  if (toNum(form.driverCancellationCharge) < 0) return "Driver Cancellation Charge cannot be negative";

  if (form.peakHourEnabled) {
    const invalidPeak = form.peakHour.some(
      (row) => !row.start || !row.end || toNum(row.kilometerPrice) <= 0 || row.start >= row.end
    );
    if (invalidPeak) {
      return "Each peak row needs start, end, valid kilometerPrice, and start time before end time";
    }
  }

  return "";
};
