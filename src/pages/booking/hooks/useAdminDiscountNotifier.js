import { useEffect, useRef } from 'react';
import Swal from 'sweetalert2';
import { ApiRequestUtils } from '../../../utils/apiRequestUtils';
import { API_ROUTES } from '../../../utils/constants';

const showAdminDiscountToast = (icon, title) => {
  Swal.fire({
    toast: true,
    position: 'top-end',
    icon,
    title,
    showConfirmButton: false,
    timer: 2500,
    timerProgressBar: true,
  });
};

export const useAdminDiscountNotifier = ({ quoteMeta, setQuoteMeta, enabled = true }) => {
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
      showAdminDiscountToast('info', 'Admin discount is pending SUPER_USER approval.');
    } else if (status === 'APPROVED' || status === 'AUTO_APPROVED') {
      showAdminDiscountToast('success', 'Admin discount approved and applied.');
    } else if (status === 'REJECTED') {
      showAdminDiscountToast('warning', 'Admin discount rejected. Final amount excludes admin discount.');
    }

    lastNotifiedStatusRef.current = status;
  }, [enabled, quoteMeta?.quoteRef, quoteMeta?.adminDiscount?.status]);

  const handleAdminDiscountDecision = async (action) => {
    if (!enabled) return;
    const discountId = quoteMeta?.adminDiscount?.id;
    if (!discountId) return;

    const remarks = action === 'approve' ? 'Approved by super user' : 'Rejected by super user';
    const route = action === 'approve' ? API_ROUTES.ADMIN_DISCOUNT_APPROVE : API_ROUTES.ADMIN_DISCOUNT_REJECT;
    showAdminDiscountToast('info', action === 'approve' ? 'Submitting approval...' : 'Submitting rejection...');

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
    } else {
      showAdminDiscountToast('error', response?.message || 'Unable to update admin discount status.');
    }
  };

  return { handleAdminDiscountDecision };
};
