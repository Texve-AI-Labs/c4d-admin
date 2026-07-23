import moment from "moment";

export const normalizeZoneValue = (value) => String(value ?? "").trim();

export const buildDailySlotQuery = ({ date, fromDate, toDate, zone, subZoneId, page, limit }) => {
  const query = { page, limit };

  if (date) query.date = date;
  if (fromDate) query.fromDate = fromDate;
  if (toDate) query.toDate = toDate;
  if (zone) query.zone = normalizeZoneValue(zone);
  if (subZoneId) query.subZoneId = subZoneId;

  return query;
};

export const formatDate = (value) => (value ? moment(value).format("DD-MM-YYYY") : "-");
export const formatDateTime = (value) => (value ? moment(value).format("DD-MM-YYYY hh:mm A") : "-");
export const formatTime = (value) => (value ? value.slice(0, 5) : "-");

export const normalizeText = (value) => String(value ?? "").trim().toLowerCase();

export const getBookingEntityLabel = (booking = {}) => {
  if (booking.driverId) return "Driver";
  if (booking.parcelId) return "Parcel";
  if (booking.autoId) return "Auto";
  if (booking.bikeId) return "Bike";
  return "Booking";
};

export const getBookingEntityValue = (booking = {}) => {
  if (booking.driver) {
    const driverName = [booking.driver.firstName, booking.driver.lastName].filter(Boolean).join(" ");
    return driverName || booking.driver.phoneNumber || `Driver ${booking.driverId}`;
  }
  if (booking.parcel) return booking.parcel.name || booking.parcel.vehicleNumber || `Parcel ${booking.parcelId}`;
  if (booking.auto) return booking.auto.name || booking.auto.vehicleNumber || `Auto ${booking.autoId}`;
  if (booking.bike) return booking.bike.name || booking.bike.bikeNumber || `Bike ${booking.bikeId}`;
  return "-";
};

export const getSlotStateChip = (slot) => {
  if (slot?.isExpired) return { label: "EXPIRED", className: "inline-flex rounded-full bg-gray-500 px-2 py-0.5 text-xs font-semibold text-white" };
  if (slot?.isFull) return { label: "FULL", className: "inline-flex rounded-full bg-red-500 px-2 py-0.5 text-xs font-semibold text-white" };
  if (slot?.isOpen) return { label: "OPEN", className: "inline-flex rounded-full bg-green-500 px-2 py-0.5 text-xs font-semibold text-white" };
  return { label: "CLOSED", className: "inline-flex rounded-full bg-blue-gray-500 px-2 py-0.5 text-xs font-semibold text-white" };
};

export const getVehicleTypeChip = (value) => {
  const normalized = String(value || "").toUpperCase();
  if (normalized === "BIKE") return { label: normalized, className: "inline-flex rounded-full bg-indigo-500 px-2 py-0.5 text-xs font-semibold text-white" };
  if (normalized === "AUTO") return { label: normalized, className: "inline-flex rounded-full bg-amber-500 px-2 py-0.5 text-xs font-semibold text-white" };
  if (normalized === "PARCEL") return { label: normalized, className: "inline-flex rounded-full bg-emerald-500 px-2 py-0.5 text-xs font-semibold text-white" };
  if (normalized === "CAR" || normalized === "CAB") return { label: normalized, className: "inline-flex rounded-full bg-cyan-600 px-2 py-0.5 text-xs font-semibold text-white" };
  return { label: normalized || "-", className: "inline-flex rounded-full bg-blue-gray-500 px-2 py-0.5 text-xs font-semibold text-white" };
};

export const getBookingStatusChip = (value) => {
  const normalized = String(value || "").toUpperCase();
  if (normalized === "BOOKED") return { label: normalized, className: "inline-flex rounded-full bg-green-600 px-2 py-0.5 text-xs font-semibold text-white" };
  if (normalized === "CANCELLED") return { label: normalized, className: "inline-flex rounded-full bg-red-600 px-2 py-0.5 text-xs font-semibold text-white" };
  if (normalized === "PENDING") return { label: normalized, className: "inline-flex rounded-full bg-amber-500 px-2 py-0.5 text-xs font-semibold text-white" };
  if (normalized === "EXPIRED") return { label: normalized, className: "inline-flex rounded-full bg-gray-500 px-2 py-0.5 text-xs font-semibold text-white" };
  return { label: normalized || "-", className: "inline-flex rounded-full bg-blue-gray-500 px-2 py-0.5 text-xs font-semibold text-white" };
};
