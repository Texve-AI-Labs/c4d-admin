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
