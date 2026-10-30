import moment from "moment";

export const normalizeZoneValue = (value) => String(value ?? "").trim();

export const buildDailySlotQuery = ({ date, fromDate, toDate, zone, slotId, page, limit }) => {
  const query = { page, limit };

  if (date) query.date = date;
  if (fromDate) query.fromDate = fromDate;
  if (toDate) query.toDate = toDate;
  if (zone) query.zone = normalizeZoneValue(zone);
  if (slotId) query.slotId = slotId;

  return query;
};

export const formatDate = (value) => (value ? moment(value).format("DD-MM-YYYY") : "-");
export const formatDateTime = (value) => (value ? moment(value).format("DD-MM-YYYY hh:mm A") : "-");
export const formatTime = (value) => (value ? String(value) : "-");
export const formatDisplayTime = (slot = {}) => {
  if (slot.displayTime) return slot.displayTime;
  if (slot.startTime && slot.endTime) return `${formatTime(slot.startTime)} - ${formatTime(slot.endTime)}`;
  return "-";
};

export const normalizeText = (value) => String(value ?? "").trim().toLowerCase();

export const getBookingEntityValue = (booking = {}) => {
  if (booking.driverName) return booking.driverName;
  if (booking.driver) {
    const driverName = [booking.driver.firstName, booking.driver.lastName].filter(Boolean).join(" ");
    return driverName || booking.driver.phoneNumber || `Driver ${booking.driverId}`;
  }
  return "-";
};

export const getBookingPhoneNumber = (booking = {}) => {
  if (booking.phoneNumber) return booking.phoneNumber;
  if (booking.driver?.phoneNumber) return booking.driver.phoneNumber;
  return "-";
};

export const getSlotStateChip = (slot) => {
  const status = String(slot?.status || "").toUpperCase();
  if (status === "EXPIRED") return { label: "EXPIRED", className: "inline-flex rounded-full bg-gray-500 px-2 py-0.5 text-xs font-semibold text-white" };
  if (status === "FULL") return { label: "FULL", className: "inline-flex rounded-full bg-red-500 px-2 py-0.5 text-xs font-semibold text-white" };
  if (status === "OPEN") return { label: "OPEN", className: "inline-flex rounded-full bg-green-500 px-2 py-0.5 text-xs font-semibold text-white" };
  return { label: "CLOSED", className: "inline-flex rounded-full bg-blue-gray-500 px-2 py-0.5 text-xs font-semibold text-white" };
};

export const getBookingStatusChip = (value) => {
  const normalized = String(value || "").toUpperCase();
  if (normalized === "BOOKED") return { label: normalized, className: "inline-flex rounded-full bg-green-600 px-2 py-0.5 text-xs font-semibold text-white" };
  if (normalized === "CANCELLED") return { label: normalized, className: "inline-flex rounded-full bg-red-600 px-2 py-0.5 text-xs font-semibold text-white" };
  if (normalized === "PENDING") return { label: normalized, className: "inline-flex rounded-full bg-amber-500 px-2 py-0.5 text-xs font-semibold text-white" };
  if (normalized === "EXPIRED") return { label: normalized, className: "inline-flex rounded-full bg-gray-500 px-2 py-0.5 text-xs font-semibold text-white" };
  return { label: normalized || "-", className: "inline-flex rounded-full bg-blue-gray-500 px-2 py-0.5 text-xs font-semibold text-white" };
};

export const getDayChip = (value) => {
  const normalized = String(value || "").toUpperCase();
  const base = "inline-flex rounded-full px-2 py-0.5 text-xs font-semibold text-white";

  if (normalized === "MONDAY") return { label: normalized, className: `${base} bg-yellow-600` };
  if (normalized === "TUESDAY") return { label: normalized, className: `${base} bg-blue-600` };
  if (normalized === "WEDNESDAY") return { label: normalized, className: `${base} bg-green-600` };
  if (normalized === "THURSDAY") return { label: normalized, className: `${base} bg-orange-600` };
  if (normalized === "FRIDAY") return { label: normalized, className: `${base} bg-pink-600` };
  if (normalized === "SATURDAY") return { label: normalized, className: `${base} bg-red-600` };
  if (normalized === "SUNDAY") return { label: normalized, className: `${base} bg-pink-500` };

  return { label: normalized || "-", className: `${base} bg-blue-gray-500` };
};
