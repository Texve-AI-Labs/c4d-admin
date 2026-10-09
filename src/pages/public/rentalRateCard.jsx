import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardBody, CardHeader, Typography } from '@material-tailwind/react';
import { ApiRequestUtils } from '@/utils/apiRequestUtils';
import { API_ROUTES } from '@/utils/constants';

const CATEGORY_OPTIONS = [
  { value: 'ECONOMY_GO', label: 'Economy Go' },
  { value: 'COMFORT', label: 'Comfort' },
  { value: 'PREMIUM', label: 'Premium' },
  { value: 'PREMIUM_XL', label: 'Premium XL' },
];
const BOOKING_TYPE_OPTIONS = [
  { value: 'DROP ONLY', label: 'Drop Only' },
  { value: 'ROUND TRIP', label: 'Round Trip' },
];
const BASE_TABLE_HEADINGS = [
  { label: 'Category', backgroundColor: '#dbeafe' },
  { label: 'Car Types', backgroundColor: '#cffafe' },
  { label: 'Hours', backgroundColor: '#ffe4e6' },
  { label: 'Kilometers', backgroundColor: '#fef3c7' },
];
const RATE_COLUMN_GROUPS = [
  { bookingType: 'DROP_ONLY', acType: 'AC', backgroundColor: '#d1fae5', cellClassName: 'bg-emerald-50' },
  { bookingType: 'DROP_ONLY', acType: 'NON_AC', backgroundColor: '#ecfccb', cellClassName: 'bg-lime-50' },
  { bookingType: 'ROUND_TRIP', acType: 'AC', backgroundColor: '#ffedd5', cellClassName: 'bg-orange-50' },
  { bookingType: 'ROUND_TRIP', acType: 'NON_AC', backgroundColor: '#fef9c3', cellClassName: 'bg-yellow-50' },
];
const BOOKING_TYPE_FILTER_TO_RATE_KEY = {
  'DROP ONLY': 'DROP_ONLY',
  'ROUND TRIP': 'ROUND_TRIP',
};
const DEFAULT_ZONE = 'Vellore';

const toDisplayValue = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return '-';
  }
  if (Number.isInteger(numeric)) {
    return numeric.toString();
  }
  return numeric.toFixed(2);
};

const formatText = (value) => {
  if (value === null || value === undefined || value === '') {
    return '-';
  }
  if (Array.isArray(value)) {
    return value.length ? value.join(', ') : '-';
  }
  return value;
};

const getLabel = (labels, value) => labels?.[value] || value;

const normalizeCategoryRows = (data) => (Array.isArray(data) ? data : data ? [data] : []);

const toTitleCase = (value) => value
  .toLowerCase()
  .replace(/\b\w/g, (char) => char.toUpperCase());

const getBookingTypeLabel = (bookingType, labels = {}) => {
  const fallback = bookingType === 'DROP_ONLY' ? 'DROP ONLY' : 'ROUND TRIP';
  return toTitleCase(labels[bookingType] || fallback);
};

const getAcTypeLabel = (acType, labels = {}) => {
  const fallback = acType === 'NON_AC' ? 'NON AC' : 'AC';
  return toTitleCase(labels[acType] || fallback);
};

const getRateValue = (rate, key) => {
  if (rate?.configured === false && ['kilometerRate', 'kilometerAmount'].includes(key)) {
    return 'Not configured';
  }
  if (rate?.extraKilometerConfigured === false && ['extraKilometerRate', 'extraKilometerAmount'].includes(key)) {
    return 'Extra KM not configured';
  }
  return toDisplayValue(rate?.[key] ?? 0);
};

export function RentalTariffRateCard() {
  const [tariffRows, setTariffRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [serviceAreas, setServiceAreas] = useState([]);
  const [selectedZone, setSelectedZone] = useState(DEFAULT_ZONE);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedBookingType, setSelectedBookingType] = useState('');

  const fetchServiceAreas = useCallback(async () => {
    try {
      const response = await ApiRequestUtils.getWithQueryParam(API_ROUTES.GEO_MARKINGS_LIST, { type: 'Service Area' });
      const areas = Array.isArray(response?.data)
        ? response.data.filter((area) => area?.type === 'Service Area')
        : [];
      setServiceAreas(areas);
    } catch (err) {
      console.error('Failed to fetch service areas', err);
    }
  }, []);

  const loadTariffs = useCallback(async (
    zoneValue = '',
    categoryValue = '',
    bookingTypeValue = '',
  ) => {
    try {
      setLoading(true);
      const params = {
        ...(zoneValue ? { zone: zoneValue } : {}),
        ...(categoryValue ? { category: categoryValue } : {}),
        ...(bookingTypeValue ? { bookingType: bookingTypeValue } : {}),
      };
      const response = await ApiRequestUtils.getWithQueryParam(
        API_ROUTES.RENTAL_OUTSTATION_TARIFFS,
        params,
      );

      setMeta(response?.meta || null);
      setTariffRows(normalizeCategoryRows(response?.data));
      setError('');
    } catch (err) {
      console.error('Failed to fetch rental tariffs', err);
      setError('Unable to load rental outstation tariff details.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServiceAreas();
  }, [fetchServiceAreas]);

  useEffect(() => {
    loadTariffs(selectedZone, selectedCategory, selectedBookingType);
  }, [selectedZone, selectedCategory, selectedBookingType, loadTariffs]);

  const serviceAreaOptions = useMemo(() => {
    const list = Array.isArray(serviceAreas) ? serviceAreas : [];
    const hasDefaultZone = list.some((area) => area?.name === DEFAULT_ZONE);
    if (hasDefaultZone) {
      return list;
    }
    return [{ id: 'default-zone', name: DEFAULT_ZONE, type: 'Service Area' }, ...list];
  }, [serviceAreas]);

  const hasData = tariffRows.length > 0;

  const handleZoneChange = (event) => {
    setSelectedZone(event.target.value);
  };

  const handleCategoryChange = (event) => {
    setSelectedCategory(event.target.value);
  };

  const handleBookingTypeChange = (event) => {
    setSelectedBookingType(event.target.value);
  };

  const visibleRateGroups = useMemo(() => {
    const selectedBookingTypeKey = BOOKING_TYPE_FILTER_TO_RATE_KEY[selectedBookingType];
    if (!selectedBookingTypeKey) {
      return RATE_COLUMN_GROUPS;
    }
    return RATE_COLUMN_GROUPS.filter((group) => group.bookingType === selectedBookingTypeKey);
  }, [selectedBookingType]);

  const renderCategoryTable = () => (
    <div className="mt-4 h-[82vh] overflow-auto">
      <table className="w-full min-w-[2200px] table-auto border-collapse">
        <thead className="sticky top-0 z-40">
          <tr>
            {BASE_TABLE_HEADINGS.map((heading) => (
              <th
                key={heading.label}
                rowSpan={3}
                className="sticky top-0 z-30 whitespace-nowrap border border-black px-4 py-2 text-left"
                style={{ backgroundColor: heading.backgroundColor }}
              >
                {heading.label}
              </th>
            ))}
            {[...new Set(visibleRateGroups.map((group) => group.bookingType))].map((bookingType) => {
              const colSpan = visibleRateGroups.filter((group) => group.bookingType === bookingType).length * 4;
              return (
                <th
                  key={bookingType}
                  colSpan={colSpan}
                  className="sticky top-0 z-30 whitespace-nowrap border border-black px-4 py-2 text-center"
                  style={{ backgroundColor: bookingType === 'DROP_ONLY' ? '#bbf7d0' : '#fed7aa' }}
                >
                  {getBookingTypeLabel(bookingType, meta?.labels)}
                </th>
              );
            })}
          </tr>
          <tr>
        {visibleRateGroups.map((group) => (
          <th
            key={`${group.bookingType}-${group.acType}`}
            colSpan={4}
            className="sticky top-[41px] z-30 whitespace-nowrap border border-black px-4 py-2 text-center"
            style={{ backgroundColor: group.backgroundColor }}
          >
            {getAcTypeLabel(group.acType, meta?.labels)}
          </th>
        ))}
      </tr>
      <tr>
            {visibleRateGroups.flatMap((group) => (
              ['Rate', 'Amount', 'Extra Rate', 'Extra Amount'].map((label) => (
                <th
                  key={`${group.bookingType}-${group.acType}-${label}`}
                  className="sticky top-[82px] z-30 whitespace-nowrap border border-black px-4 py-2 text-center"
                  style={{ backgroundColor: group.backgroundColor }}
                >
                  {label}
                </th>
              ))
            ))}
          </tr>
        </thead>
        <tbody>
          {tariffRows.map((row) => {
            const rowKey = [
              row?.category ?? 'category',
              row?.hours ?? 'hours',
              row?.kilometers ?? 'kilometers',
            ].join('-');

            return (
              <tr key={row?.id ?? rowKey}>
                <td className="whitespace-nowrap border border-black px-4 py-2 font-semibold">
                  {formatText(row.categoryLabel || getLabel(meta?.labels, row.category))}
                </td>
                <td className="whitespace-nowrap border border-black px-4 py-2">
                  {formatText(row.carTypes)}
                </td>
                <td className="whitespace-nowrap border border-black px-4 py-2">{formatText(row.hours)}</td>
                <td className="whitespace-nowrap border border-black px-4 py-2">{formatText(row.kilometers)}</td>
                {visibleRateGroups.flatMap((group) => {
                  const rate = row.rates?.[group.bookingType]?.[group.acType] || {};
                  return [
                    <td key={`${group.bookingType}-${group.acType}-rate`} className={`whitespace-nowrap border border-black px-4 py-2 ${group.cellClassName}`}>
                      {getRateValue(rate, 'kilometerRate')}
                    </td>,
                    <td key={`${group.bookingType}-${group.acType}-amount`} className={`whitespace-nowrap border border-black px-4 py-2 ${group.cellClassName}`}>
                      {getRateValue(rate, 'kilometerAmount')}
                    </td>,
                    <td key={`${group.bookingType}-${group.acType}-extra-rate`} className={`whitespace-nowrap border border-black px-4 py-2 ${group.cellClassName}`}>
                      {getRateValue(rate, 'extraKilometerRate')}
                    </td>,
                    <td key={`${group.bookingType}-${group.acType}-extra-amount`} className={`whitespace-nowrap border border-black px-4 py-2 ${group.cellClassName}`}>
                      {getRateValue(rate, 'extraKilometerAmount')}
                    </td>,
                  ];
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="mb-8 flex flex-col gap-12">
      <Card>
        <CardHeader
          variant="gradient"
          className="mt-8 mx-0 p-6 w-full bg-primary-500"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col gap-1">
              <Typography variant="h6" color="white">
                Rental Outstation Tariff Rate Card
              </Typography>
              {meta?.zone && (
                <Typography variant="small" className="text-white/90">
                  Zone: {meta.zone} {meta?.packageId ? `(Package #${meta.packageId})` : ''}
                </Typography>
              )}
            </div>
            <div className="grid w-full grid-cols-1 gap-3 text-white sm:grid-cols-3 xl:w-[48rem]">
              <div className="flex flex-col gap-2">
                <label className="text-xs uppercase tracking-wide">
                  Service Pickup Area
                </label>
                <select
                  value={selectedZone}
                  onChange={handleZoneChange}
                  className="rounded-lg border border-white/60 bg-white/10 px-3 py-2 text-sm text-white focus:outline-none"
                >
                  {serviceAreaOptions.map((area) => (
                    <option key={area.id} value={area.name} className="text-black">
                      {area.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs uppercase tracking-wide">
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={handleCategoryChange}
                  className="rounded-lg border border-white/60 bg-white/10 px-3 py-2 text-sm text-white focus:outline-none"
                >
                  <option value="" className="text-black">All Categories</option>
                  {CATEGORY_OPTIONS.map((category) => (
                    <option key={category.value} value={category.value} className="text-black">
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs uppercase tracking-wide">
                  Booking Type
                </label>
                <select
                  value={selectedBookingType}
                  onChange={handleBookingTypeChange}
                  className="rounded-lg border border-white/60 bg-white/10 px-3 py-2 text-sm text-white focus:outline-none"
                >
                  <option value="" className="text-black">All Booking Types</option>
                  {BOOKING_TYPE_OPTIONS.map((bookingType) => (
                    <option key={bookingType.value} value={bookingType.value} className="text-black">
                      {bookingType.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardBody className="px-0 pt-0 pb-2">
          {loading && (
            <div className="p-6 text-center text-sm text-blue-gray-500">Loading rate card...</div>
          )}
          {error && !loading && (
            <div className="p-6 text-center text-sm text-red-500">{error}</div>
          )}
          {!loading && !error && !hasData && (
            <div className="p-6 text-center text-sm text-blue-gray-500">No tariff data available.</div>
          )}
          {!loading && !error && hasData && (
            renderCategoryTable()
          )}
        </CardBody>
      </Card>
    </div>
  );
}

export default RentalTariffRateCard;
