export const getPricingPayload = (values = {}) => {
    const isRentalDropOnly = values.serviceType === 'RENTAL_DROP_TAXI' || (
        values.serviceType === 'RENTAL' &&
        String(values.packageTypeSelected || '').toUpperCase() === 'OUTSTATION' &&
        String(values.tripType || '').toUpperCase() === 'DROP ONLY'
    );
    if (!isRentalDropOnly) return {};
    return {
        useRoundTripOdometer: values.useRoundTripOdometer === true,
    };
};