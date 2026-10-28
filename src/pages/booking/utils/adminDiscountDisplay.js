const toAmount = (value) => {
    const amount = Number(value);
    return Number.isFinite(amount) && amount > 0 ? amount : 0;
};

export const getAdminDiscountAmount = ({
    discount = {},
    booking = {},
    quoteAmount = 0,
    systemDiscountAmount = 0,
    walletAmount = 0,
}) => {
    const backendAmount = [
        discount.discountAmount,
        booking?.paymentDetails?.adminDiscount?.discountAmount,
        booking?.paymentDetails?.details?.adminDiscountAmount,
        booking?.adminDiscountAmount,
    ].map(toAmount).find((amount) => amount > 0) || 0;

    if (backendAmount > 0) return backendAmount;

    const discountValue = toAmount(discount.discountValue);
    if (discountValue <= 0) return 0;

    if (String(discount.discountType || '').toUpperCase() === 'AMOUNT') {
        return discountValue;
    }

    const baseAmount = Math.max(
        0,
        toAmount(quoteAmount) - toAmount(systemDiscountAmount) - toAmount(walletAmount)
    );

    return baseAmount * (discountValue / 100);
};
