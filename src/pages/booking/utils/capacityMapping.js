const normalizeCapacityKey = (value) => String(value || '').trim().toUpperCase();

const CATEGORY_SERVICES = new Set([
    'RIDES',
    'AUTO',
    'RENTAL',
    'RENTAL_HOURLY_PACKAGE',
    'RENTAL_DROP_TAXI',
]);

export const getCapacityValues = ({
    serviceType,
    carType,
    category,
    capacityConfig = {},
}) => {
    const normalizedServiceType = normalizeCapacityKey(serviceType);
    const isDriver = normalizedServiceType === 'DRIVER';
    const useCategory = CATEGORY_SERVICES.has(normalizedServiceType);
    const lookupKey = normalizeCapacityKey(useCategory ? category : carType);
    const luggageSource = isDriver || !useCategory
        ? (capacityConfig?.luggageCapacity?.carTypes || capacityConfig?.luggageCapacity)
        : (capacityConfig?.luggageCapacity?.categories || capacityConfig?.luggageCapacity);
    const seaterSource = isDriver || !useCategory
        ? (capacityConfig?.seaterCapacity?.carTypes || capacityConfig?.seaterCapacity)
        : (capacityConfig?.seaterCapacity?.categories || capacityConfig?.seaterCapacity);

    return {
        luggage: luggageSource?.[lookupKey] ?? '',
        seaterCapacity: seaterSource?.[lookupKey] ?? '',
    };
};
