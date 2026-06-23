import { API_ROUTES } from '../../../utils/constants';
import { ApiRequestUtils } from '../../../utils/apiRequestUtils';

export const normalizeQuoteRefSafe = (value) => {
  const parsed = String(value ?? '').trim();
  if (!parsed) return '';
  const lowered = parsed.toLowerCase();
  if (lowered === 'null' || lowered === 'undefined') return '';
  return parsed;
};

export const normalizeBookingIdSafe = (value) => {
  const parsed = String(value ?? '').trim();
  if (!parsed) return '';
  const lowered = parsed.toLowerCase();
  if (lowered === 'null' || lowered === 'undefined') return '';
  const asNumber = Number(parsed);
  if (!Number.isFinite(asNumber) || asNumber <= 0) return '';
  return String(Math.trunc(asNumber));
};

export const getQuoteRefSafe = (bookingDetails, paramsPassed) =>
  normalizeQuoteRefSafe(bookingDetails?.quoteRef || paramsPassed?.quoteRef);

export const normalizeAdminDiscountHistorySafe = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.history)) return payload.history;
  if (payload && typeof payload === 'object') return [payload];
  return [];
};

export const buildConfirmAdminDiscountPayloadSafe = (source = {}) => {
  const discountType = String(source?.discountType || '').trim().toUpperCase();
  const discountValue = Number(source?.discountValue);
  const remarks = String(source?.remarks || '').trim();
  if (!discountType || !Number.isFinite(discountValue) || discountValue <= 0) return null;
  const payload = { discountType, discountValue };
  if (remarks) payload.remarks = remarks;
  return payload;
};

export const normalizeAdminDiscountStatusSafe = (payload) => {
  if (!payload || typeof payload !== 'object') return null;
  return payload;
};

export const fetchAdminDiscountStatusSafe = async ({ quoteRef, bookingId }) => {
  const primaryQuery = quoteRef ? { quoteRef } : { bookingId };
  const response = await ApiRequestUtils.getWithQueryParam(API_ROUTES.ADMIN_DISCOUNT_STATUS, primaryQuery);
  let statusData = normalizeAdminDiscountStatusSafe(response?.data);

  if (!statusData && quoteRef && bookingId) {
    const fallbackQuery = primaryQuery.quoteRef ? { bookingId } : { quoteRef };
    const fallbackResponse = await ApiRequestUtils.getWithQueryParam(
      API_ROUTES.ADMIN_DISCOUNT_STATUS,
      fallbackQuery
    );
    statusData = normalizeAdminDiscountStatusSafe(fallbackResponse?.data);
  }

  return statusData;
};

export const fetchAdminDiscountHistorySafe = async ({ quoteRef, bookingId }) => {
  const primaryQuery = quoteRef ? { quoteRef } : { bookingId };
  const response = await ApiRequestUtils.getWithQueryParam(API_ROUTES.ADMIN_DISCOUNT_HISTORY, primaryQuery);
  let rows = normalizeAdminDiscountHistorySafe(response?.data);

  if (!rows.length && quoteRef && bookingId) {
    const fallbackQuery = primaryQuery.quoteRef ? { bookingId } : { quoteRef };
    const fallbackResponse = await ApiRequestUtils.getWithQueryParam(
      API_ROUTES.ADMIN_DISCOUNT_HISTORY,
      fallbackQuery
    );
    rows = normalizeAdminDiscountHistorySafe(fallbackResponse?.data);
  }

  return rows;
};
