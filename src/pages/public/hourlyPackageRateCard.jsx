import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardBody, CardHeader, Typography } from '@material-tailwind/react';
import { ApiRequestUtils } from '@/utils/apiRequestUtils';
import { API_ROUTES } from '@/utils/constants';

const CAR_TYPES = ['Mini', 'Sedan', 'SUV', 'MUV'];
const FIELDS = [
  { key: 'baseFare', label: 'Base Fare', aliases: ['baseFare', 'price'] },
  { key: 'perKm', label: 'Per KM', aliases: ['perKm', 'extraKmRate', 'extraKmPrice'] },
  { key: 'extraHour', label: 'Extra Hour', aliases: ['extraHour', 'extraHourRate', 'extraPrice'] },
  { key: 'waitingCharge', label: 'Waiting Charge', aliases: ['waitingCharge', 'waitingPrice'] },
];
const DEFAULT_ZONE = 'Vellore';

const toDisplayValue = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return '-';
  return Number.isInteger(numeric) ? numeric.toString() : numeric.toFixed(2);
};

export function HourlyPackageRateCard() {
  const [tariffs, setTariffs] = useState([]);
  const [meta, setMeta] = useState(null);
  const [serviceAreas, setServiceAreas] = useState([]);
  const [selectedZone, setSelectedZone] = useState(DEFAULT_ZONE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadServiceAreas = useCallback(async () => {
    try {
      const response = await ApiRequestUtils.getWithQueryParam(
        API_ROUTES.GEO_MARKINGS_LIST,
        { type: 'Service Area' },
      );
      setServiceAreas(Array.isArray(response?.data)
        ? response.data.filter((area) => area?.type === 'Service Area')
        : []);
    } catch (err) {
      console.error('Failed to fetch service areas', err);
    }
  }, []);

  const loadTariffs = useCallback(async (zone) => {
    try {
      setLoading(true);
      const response = await ApiRequestUtils.getWithQueryParam(
        API_ROUTES.RENTAL_HOURLY_PACKAGE_TARIFFS,
        zone ? { zone } : {},
      );
      setTariffs(Array.isArray(response?.data) ? response.data : []);
      setMeta(response?.meta || null);
      setError('');
    } catch (err) {
      console.error('Failed to fetch hourly package tariffs', err);
      setError('Unable to load hourly package tariff details.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadServiceAreas(); }, [loadServiceAreas]);
  useEffect(() => { loadTariffs(selectedZone); }, [selectedZone, loadTariffs]);

  const zoneOptions = useMemo(() => {
    if (serviceAreas.some((area) => area?.name === DEFAULT_ZONE)) return serviceAreas;
    return [{ id: 'default-zone', name: DEFAULT_ZONE }, ...serviceAreas];
  }, [serviceAreas]);

  const renderCell = (row, carType, field) => {
    const value = (field.aliases || [field.key]).reduce(
      (result, key) => result ?? row?.[carType]?.[key] ?? row?.[key],
      undefined,
    );
    return toDisplayValue(value);
  };

  return (
    <div className="mb-8 flex flex-col gap-12">
      <Card>
        <CardHeader variant="gradient" className="mt-8 mx-0 w-full bg-primary-500 p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col gap-1">
              <Typography variant="h6" color="white">Hourly Package Rate Card</Typography>
              {meta?.zone && (
                <Typography variant="small" className="text-white/90">
                  Zone: {meta.zone} {meta?.packageId ? `(Package #${meta.packageId})` : ''}
                </Typography>
              )}
            </div>
            <div className="flex w-full flex-col gap-2 text-white lg:w-72">
              <label className="text-xs uppercase tracking-wide">Service Pickup Area</label>
              <select
                value={selectedZone}
                onChange={(event) => setSelectedZone(event.target.value)}
                className="rounded-lg border border-white/60 bg-white/10 px-3 py-2 text-sm text-white focus:outline-none"
              >
                {zoneOptions.map((area) => (
                  <option key={area.id || area.name} value={area.name} className="text-black">
                    {area.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardHeader>
        <CardBody className="overflow-x-auto px-0 pt-0 pb-2">
          {loading && <div className="p-6 text-center text-sm text-blue-gray-500">Loading rate card...</div>}
          {error && !loading && <div className="p-6 text-center text-sm text-red-500">{error}</div>}
          {!loading && !error && !tariffs.length && (
            <div className="p-6 text-center text-sm text-blue-gray-500">No hourly package data available.</div>
          )}
          {!loading && !error && tariffs.length > 0 && (
            <div className="mt-4 max-h-[70vh] overflow-y-auto">
              <table className="w-full min-w-[640px] table-auto border-collapse">
                <thead className="sticky top-0 z-40">
                  <tr>
                    <th rowSpan={2} className="border border-black bg-red-100 px-4 py-2">Hours</th>
                    <th rowSpan={2} className="border border-black bg-primary-100 px-4 py-2">KM</th>
                    {CAR_TYPES.map((car) => (
                      <th key={car} colSpan={FIELDS.length} className="border border-black bg-primary-200 px-4 py-2 text-center">
                        {car}
                      </th>
                    ))}
                  </tr>
                  <tr>
                    {CAR_TYPES.flatMap((car) => FIELDS.map((field) => (
                      <th key={`${car}-${field.key}`} className="border border-black bg-emerald-100 px-4 py-2">
                        {field.label}
                      </th>
                    )))}
                  </tr>
                </thead>
                <tbody>
                  {tariffs.map((row, index) => (
                    <tr key={`${row?.hours ?? 'h'}-${row?.kilometers ?? 'k'}-${index}`}>
                      <td className="border border-black bg-red-100 px-4 py-2">{row?.hours ?? '-'}</td>
                      <td className="border border-black bg-primary-100 px-4 py-2">{row?.kilometers ?? '-'}</td>
                      {CAR_TYPES.flatMap((car) => FIELDS.map((field) => (
                        <td key={`${index}-${car}-${field.key}`} className="border border-black px-4 py-2">
                          {renderCell(row, car, field)}
                        </td>
                      )))}
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
