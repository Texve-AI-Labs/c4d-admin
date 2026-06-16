export const buildAdminDiscountPayload = (values = {}) => {
  const discountType = values?.adminDiscountType;
  const discountValue = Number(values?.adminDiscountValue);
  const remarks = (values?.adminDiscountRemarks || '').trim();

  if (!discountType || !Number.isFinite(discountValue) || discountValue <= 0) {
    return null;
  }

  const payload = { discountType, discountValue };
  if (remarks) payload.remarks = remarks;
  return payload;
};

export const isAdminDiscountEffective = (status = '') =>
  status === 'APPROVED' || status === 'AUTO_APPROVED';

export const buildAdminDiscountFromQuoteMeta = (adminDiscount = null) => {
  if (!adminDiscount) return null;
  const status = String(adminDiscount?.status || '').trim().toUpperCase();
  const discountType = String(adminDiscount?.discountType || '').trim().toUpperCase();
  const discountValue = Number(adminDiscount?.discountValue);
  const remarks = String(adminDiscount?.remarks || '').trim();

  if (!isAdminDiscountEffective(status) || !discountType || !Number.isFinite(discountValue) || discountValue <= 0) {
    return null;
  }

  const payload = { discountType, discountValue };
  if (remarks) payload.remarks = remarks;
  return payload;
};

export const sanitizeAdminDiscountValue = (value) => {
  if (value === '' || value === null || value === undefined) return '';
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return '';
  if (parsed < 0) return '0';
  if (parsed > 5) return '5';
  return String(value);
};
