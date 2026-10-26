import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardBody, CardHeader, Typography } from '@material-tailwind/react';
import { ApiRequestUtils } from '@/utils/apiRequestUtils';
import { API_ROUTES } from '@/utils/constants';

const FIELDS = [
  { key: 'price', label: 'Package Price', aliases: ['price'] },
  { key: 'baseFare', label: 'Base Fare', aliases: ['baseFare', 'price'] },
];
const HEADER_COLORS = [
  { backgroundColor: '#e2e8f0', color: '#1e293b' },
  { backgroundColor: '#e0e7ff', color: '#312e81' },
  { backgroundColor: '#cffafe', color: '#164e63' },
  { backgroundColor: '#ccfbf1', color: '#134e4a' },
  { backgroundColor: '#d1fae5', color: '#065f46' },
  { backgroundColor: '#fef3c7', color: '#78350f' },
  { backgroundColor: '#ffedd5', color: '#7c2d12' },
  { backgroundColor: '#ffe4e6', color: '#881337' },
  { backgroundColor: '#ede9fe', color: '#4c1d95' },
  { backgroundColor: '#dbeafe', color: '#1e3a8a' },
  { backgroundColor: '#fae8ff', color: '#701a75' },
];

const toDisplayValue = (value) => {
  if (value === null || value === undefined || value === '') return '-';
  if (typeof value === 'object') {
    return value.category || value.vehicleType || value.name || value.value || '-';
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return String(value);
  return Number.isInteger(numeric) ? numeric.toString() : numeric.toFixed(2);
};

const asArray = (value) => Array.isArray(value) ? value : value ? [value] : [];
const formatCategoryLabel = (value) => String(value || '')
  .toLowerCase()
  .split('_')
  .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
  .join(' ');
const getFieldValue = (row, vehicle, aliases) => aliases.reduce(
  (result, key) => result ?? vehicle?.[key] ?? row?.[key] ?? row?.pricing?.[key],
  undefined,
);
export function HourlyPackageRateCard() {
  const [tariffs, setTariffs] = useState([]);
  const [selectedZone, setSelectedZone] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [serviceAreas, setServiceAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadTariffs = useCallback(async (zone, category) => {
    if (!zone) {
      setTariffs([]);
      setError('');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const response = await ApiRequestUtils.getWithQueryParam(
        API_ROUTES.RENTAL_LOCAL_TARIFFS,
        {
          ...(zone ? { zone } : {}),
          ...(category !== 'ALL' ? { category } : {}),
        },
      );
      setTariffs(Array.isArray(response?.data) ? response.data : (response?.data ? [response.data] : []));
      setError('');
    } catch (err) {
      console.error('Failed to fetch local rental tariffs', err);
      setError('Unable to load local rental tariff details.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const loadServiceAreas = async () => {
      try {
        const response = await ApiRequestUtils.getWithQueryParam(API_ROUTES.GEO_MARKINGS_LIST, { type: 'Service Area' });
        setServiceAreas(Array.isArray(response?.data)
          ? response.data.filter((area) => area?.type === 'Service Area')
          : []);
      } catch (err) {
        console.error('Failed to fetch service areas', err);
      }
    };
    loadServiceAreas();
  }, []);

  useEffect(() => { loadTariffs(selectedZone, selectedCategory); }, [selectedZone, selectedCategory, loadTariffs]);

  const zoneOptions = useMemo(() => [...new Set(serviceAreas.map((area) => area?.name).filter(Boolean))], [serviceAreas]);
  const categoryOptions = useMemo(() => ['ALL', ...new Set(tariffs.flatMap((row) => asArray(row?.categories).map((category) => (
    typeof category === 'string' ? category : category?.category
  )).filter(Boolean)))], [tariffs]);
  const rows = tariffs.flatMap((packageRow, packageIndex) => (
    asArray(packageRow?.categories).flatMap((categoryRow, categoryIndex) => {
      const categoryName = typeof categoryRow === 'string' ? categoryRow : categoryRow?.category;
      const categoryVehicles = asArray(categoryRow?.carTypes);
      return [{
        row: {
          ...packageRow,
          categories: categoryName,
          pricing: categoryRow?.pricing || {},
        },
        vehicleName: categoryVehicles.join(', '),
        vehicleData: categoryRow?.pricing || {},
        key: `${packageIndex}-${categoryIndex}`,
      }];
    })
  ));

  return (
    <div className="mb-8 flex flex-col gap-12">
      <Card className="overflow-hidden">
        <CardHeader variant="gradient" className="mt-4 mx-0 w-full bg-primary-500 p-4">
          <div className="grid gap-3 lg:grid-cols-[1fr_220px_220px] lg:items-end">
            <div className="flex flex-col gap-1 lg:pb-1">
              <Typography variant="h6" color="white">Rental Local Tariff</Typography>
              <Typography variant="small" className="text-white/90">
                Zone: {selectedZone || tariffs[0]?.zone || '-'}
              </Typography>
            </div>
            <div className="flex w-full flex-col gap-1 text-white">
              <label className="text-xs uppercase tracking-wide">Zone</label>
              <select
                value={selectedZone}
                onChange={(event) => setSelectedZone(event.target.value)}
                className="rounded-lg border border-white/60 bg-white/10 px-3 py-2 text-sm text-white focus:outline-none"
              >
                <option value="" className="text-black">Select Zone</option>
                {zoneOptions.map((zone) => (
                  <option key={zone} value={zone} className="text-black">{zone}</option>
                ))}
              </select>
            </div>
            <div className="flex w-full flex-col gap-1 text-white">
              <label className="text-xs uppercase tracking-wide">Category</label>
              <select value={selectedCategory} onChange={(event) => setSelectedCategory(event.target.value)} className="rounded-lg border border-white/60 bg-white/10 px-3 py-2 text-sm text-white focus:outline-none">
                {categoryOptions.map((category) => <option key={category} value={category} className="text-black">{category === 'ALL' ? 'All' : formatCategoryLabel(category)}</option>)}
              </select>
            </div>
          </div>
        </CardHeader>
        <CardBody className="overflow-x-auto px-0 pt-0 pb-2">
          {loading && <div className="p-6 text-center text-sm text-blue-gray-500">Loading rate card...</div>}
          {error && !loading && <div className="p-6 text-center text-sm text-red-500">{error}</div>}
          {!loading && !error && !selectedZone && (
            <div className="p-6 text-center text-sm text-blue-gray-500">Select a zone to view local rental tariffs.</div>
          )}
          {!loading && !error && selectedZone && !rows.length && (
            <div className="p-6 text-center text-sm text-blue-gray-500">No local rental tariff data available.</div>
          )}
          {!loading && !error && rows.length > 0 && (
            <div className="mt-4 max-h-[70vh] overflow-y-auto">
              <table className="w-full min-w-[640px] table-auto whitespace-nowrap border-collapse">
                <thead className="sticky top-0 z-40">
                  <tr>
                    {['Zone', 'Category', 'Package Duration', 'Included KM', 'Vehicle'].map((label, index) => (
                      <th key={label} style={HEADER_COLORS[index]} className="whitespace-nowrap border border-black px-4 py-2 font-semibold">{label}</th>
                    ))}
                    {FIELDS.map((field, index) => (
                      <th key={field.key} style={HEADER_COLORS[index + 5]} className="whitespace-nowrap border border-black px-4 py-2 font-semibold">
                        {field.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map(({ row, vehicleName, vehicleData, key }) => (
                    <tr key={key}>
                      <td className="whitespace-nowrap border border-black px-4 py-2">{toDisplayValue(row?.zone)}</td>
                      <td className="whitespace-nowrap border border-black px-4 py-2">{formatCategoryLabel(row?.categories)}</td>
                      <td className="whitespace-nowrap border border-black px-4 py-2">{toDisplayValue(row?.periodHours)}</td>
                      <td className="whitespace-nowrap border border-black px-4 py-2">{toDisplayValue(row?.includedKilometers ?? row?.pricing?.kilometer ?? row?.kilometer)}</td>
                      <td className="whitespace-nowrap border border-black px-4 py-2">{vehicleName || '-'}</td>
                      {FIELDS.map((field) => (
                        <td key={`${key}-${field.key}`} className="whitespace-nowrap border border-black px-4 py-2">
                          {toDisplayValue(getFieldValue(row, vehicleData, field.aliases))}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

export default HourlyPackageRateCard;
