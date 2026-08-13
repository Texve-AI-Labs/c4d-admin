import { BOOKING_STATUS } from "../../../utils/constants";

export const isQuoteEditEligibleBooking = (bookingDetails = {}) => {
  return (
    bookingDetails?.status === BOOKING_STATUS.QUOTED &&
    bookingDetails?.serviceType !== "BIKE" &&
    bookingDetails?.serviceType !== "PARCEL"
  );
};

export const shouldAutoFetchAdminDiscountStatus = ({
  bookingDetails = {},
  paramsPassed = {},
  adminDiscountMetaStatus = "",
  paymentAdminDiscountStatus = "",
  adminDiscountStatus = "",
} = {}) => {
  const quoteRef = bookingDetails?.quoteRef || paramsPassed?.quoteRef;
  const bookingId = bookingDetails?.id || paramsPassed?.bookingId;
  if (!quoteRef && !bookingId) return false;

  const visibleStatus =
    String(paymentAdminDiscountStatus || "").trim() ||
    String(adminDiscountStatus || "").trim() ||
    String(adminDiscountMetaStatus || "").trim();

  if (visibleStatus) return false;

  return isQuoteEditEligibleBooking(bookingDetails);
};
