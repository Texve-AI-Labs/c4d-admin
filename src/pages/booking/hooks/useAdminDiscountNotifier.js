import { useEffect, useRef } from 'react';
import Swal from 'sweetalert2';
import { ApiRequestUtils } from '../../../utils/apiRequestUtils';
import { API_ROUTES } from '../../../utils/constants';

const showAdminDiscountToast = (icon, title, text = '') => {
  Swal.fire({
    toast: true,
    position: 'top-end',
    icon,
    title,
    text,
    showConfirmButton: false,
    timer: 5000,
    timerProgressBar: true,
  });
};

export const useAdminDiscountNotifier = ({
  quoteMeta,
  setQuoteMeta,
  setQuoteDetails,
  onApprovedStatus,
  enabled = true,
  pendingToastTitle = 'Admin Discount: Awaiting Approval',
  pendingToastTextBuilder,
}) => {
  const lastNotifiedStatusRef = useRef('');
  const lastNotifiedQuoteRefRef = useRef('');

  useEffect(() => {
    if (!enabled) return;
    const quoteRef = quoteMeta?.quoteRef || '';
    const status = String(quoteMeta?.adminDiscount?.status || '').toUpperCase();
    if (!quoteRef || !status) return;

    if (lastNotifiedQuoteRefRef.current !== quoteRef) {
      lastNotifiedQuoteRefRef.current = quoteRef;
      lastNotifiedStatusRef.current = '';
    }

    if (lastNotifiedStatusRef.current === status) {
      return;
    }

    if (status === 'PENDING') {
      const pendingText = typeof pendingToastTextBuilder === 'function'
        ? pendingToastTextBuilder({ quoteRef, status })
        : `Quote: ${quoteRef}. Waiting for SUPER_USER approval.`;
      showAdminDiscountToast(
        'info',
        pendingToastTitle,
        pendingText
      );
    } else if (status === 'APPROVED' || status === 'AUTO_APPROVED') {
      showAdminDiscountToast(
        'success',
        'Admin Discount: Approved',
        `Quote: ${quoteRef}. Discount is now included in fare.`
      );
      if (typeof onApprovedStatus === 'function') {
        onApprovedStatus({ quoteRef, status });
      }
    } else if (status === 'REJECTED') {
      showAdminDiscountToast(
        'warning',
        'Admin Discount: Rejected',
        `Quote: ${quoteRef}. Final fare excludes admin discount.`
      );
    }

    lastNotifiedStatusRef.current = status;
  }, [enabled, quoteMeta?.quoteRef, quoteMeta?.adminDiscount?.status]);

  const handleAdminDiscountDecision = async (action) => {
    if (!enabled) return;
    const discountId = quoteMeta?.adminDiscount?.id;
    if (!discountId) return;

    const remarks = action === 'approve' ? 'Approved by super user' : 'Rejected by super user';
    const route = action === 'approve' ? API_ROUTES.ADMIN_DISCOUNT_APPROVE : API_ROUTES.ADMIN_DISCOUNT_REJECT;
    showAdminDiscountToast(
      'info',
      action === 'approve' ? 'Submitting Approval...' : 'Submitting Rejection...',
      `Discount ID: ${discountId}`
    );

    const response = await ApiRequestUtils.update(route, { discountId, remarks });
    if (response?.success) {
      const updatedStatus = action === 'approve' ? 'APPROVED' : 'REJECTED';
      setQuoteMeta((prev) => ({
        ...(prev || {}),
        adminDiscount: {
          ...(prev?.adminDiscount || {}),
          status: updatedStatus,
        },
      }));
      if (typeof setQuoteDetails === 'function') {
        setQuoteDetails((prev) => ({
          ...(prev || {}),
          adminDiscount: {
            ...(prev?.adminDiscount || {}),
            status: updatedStatus,
          },
        }));
      }
    } else {
      showAdminDiscountToast('error', 'Unable to update admin discount status.', response?.message || '');
    }
  };

  return { handleAdminDiscountDecision };
};
