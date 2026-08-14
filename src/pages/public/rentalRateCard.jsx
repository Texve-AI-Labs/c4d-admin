import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardBody, CardHeader, Typography } from '@material-tailwind/react';
import { ApiRequestUtils } from '@/utils/apiRequestUtils';
import { API_ROUTES } from '@/utils/constants';

const CAR_TYPES = ['Mini', 'Sedan', 'SUV', 'MUV'];
const FIELD_CONFIG = [
  { key: 'acDropOnlyRate', label: 'AC Drop Km Rate' },
  { key: 'acDropOnly', label: 'AC Drop Only' },
  { key: 'acRoundTripRate', label: 'AC RT Km Rate' },
  { key: 'acRoundTrip', label: 'AC Round Trip' },
  { key: 'nonAcDropOnlyRate', label: 'Non-AC Drop Km Rate' },
  { key: 'nonAcDropOnly', label: 'Non-AC Drop Only' },
  { key: 'nonAcRoundTripRate', label: 'Non-AC RT Km Rate' },
  { key: 'nonAcRoundTrip', label: 'Non-AC Round Trip' },
];
const RATE_COLUMNS = new Set([
  'acDropOnlyRate',
  'acRoundTripRate',
  'nonAcDropOnlyRate',
  'nonAcRoundTripRate',
]);
const DEFAULT_ZONE = 'Vellore';
const HOURS_COLUMN_WIDTH = 110;
const KILOMETERS_COLUMN_WIDTH = 120;
const HEADER_ROW_HEIGHT = 44;

const STICKY_STYLES = {
  hours: {
    left: 0,
    minWidth: HOURS_COLUMN_WIDTH,
    width: HOURS_COLUMN_WIDTH,
  },
  kilometers: {
    left: HOURS_COLUMN_WIDTH,
    minWidth: KILOMETERS_COLUMN_WIDTH,
    width: KILOMETERS_COLUMN_WIDTH,
  },
};

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

export function RentalTariffRateCard() {
  const [tariffs, setTariffs] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [serviceAreas, setServiceAreas] = useState([]);
  const [selectedZone, setSelectedZone] = useState(DEFAULT_ZONE);

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

  const loadTariffs = useCallback(async (zoneValue = '') => {
    try {
      setLoading(true);
      const params = zoneValue ? { zone: zoneValue } : {};
      const response = await ApiRequestUtils.getWithQueryParam(
        API_ROUTES.RENTAL_OUTSTATION_TARIFFS,
        params,
      );
      setTariffs(response?.data || []);
      setMeta(response?.meta || null);
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
    loadTariffs(selectedZone);
  }, [selectedZone, loadTariffs]);

  const serviceAreaOptions = useMemo(() => {
    const list = Array.isArray(serviceAreas) ? serviceAreas : [];
    const hasDefaultZone = list.some((area) => area?.name === DEFAULT_ZONE);
    if (hasDefaultZone) {
      return list;
    }
    return [{ id: 'default-zone', name: DEFAULT_ZONE, type: 'Service Area' }, ...list];
  }, [serviceAreas]);

  const hasData = Array.isArray(tariffs) && tariffs.length > 0;

  const renderCell = (row, carType, key) => {
    const value = row?.[carType]?.[key];
    return toDisplayValue(value);
  };

  const tableHeadings = useMemo(() => (
    <>
      <tr>
        <th
          rowSpan={2}
          className="border border-black px-4 py-2 bg-red-100 sticky left-0 z-40"
          style={{ ...STICKY_STYLES.hours, zIndex: 60 }}
        >
          Hours
        </th>
        <th
          rowSpan={2}
          className="border border-black px-4 py-2 bg-primary-100 sticky z-30"
          style={{ ...STICKY_STYLES.kilometers, zIndex: 58 }}
        >
          KM
        </th>
        {CAR_TYPES.map((car) => (
          <th
            key={`group-${car}`}
            colSpan={FIELD_CONFIG.length}
            className="border border-black px-4 py-2 bg-primary-200 text-center sticky"
            style={{ zIndex: 55 }}
          >
            {car}
          </th>
        ))}
      </tr>
      <tr>
        {CAR_TYPES.map((car) => (
          FIELD_CONFIG.map((field) => {
            const isRateColumn = RATE_COLUMNS.has(field.key);
            const stickyStyle = {
              top: HEADER_ROW_HEIGHT,
              zIndex: 54,
              backgroundColor: isRateColumn ? '#d1fae5' : '#ffedd5',
            };
            return (
              <th
                key={`${car}-${field.key}`}
                className={`border border-black px-4 py-2 sticky ${isRateColumn ? 'bg-emerald-100' : 'bg-orange-100'}`}
                style={stickyStyle}
              >
                {field.label}
              </th>
            );
          })
        ))}
      </tr>
    </>
  ), []);

  const handleZoneChange = (event) => {
    setSelectedZone(event.target.value);
  };

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
            <div className="flex w-full flex-col gap-2 text-white lg:w-72">
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
          </div>
        </CardHeader>
        <CardBody className="overflow-x-auto px-0 pt-0 pb-2">
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
            <div className="max-h-[70vh] overflow-y-auto mt-4">
              <table className="w-full min-w-[640px] table-auto border-collapse">
                <thead class="sticky top-0 z-40">{tableHeadings}</thead>
                <tbody>
                  {tariffs.map((row) => (
                    <tr key={`${row?.hours ?? 'h'}-${row?.kilometers ?? 'k'}`}>
                      <td
                        className="border border-black px-4 py-2 bg-red-100 sticky left-0 z-20"
                        style={STICKY_STYLES.hours}
                      >
                        {row?.hours ?? '-'}
                      </td>
                      <td
                        className="border border-black px-4 py-2 bg-primary-100 sticky z-10"
                        style={STICKY_STYLES.kilometers}
                      >
                        {row?.kilometers ?? '-'}
                      </td>
                      {CAR_TYPES.map((car) => (
                        FIELD_CONFIG.map((field) => (
                          <td
                            key={`${row?.hours ?? 'h'}-${row?.kilometers ?? 'k'}-${car}-${field.key}`}
                            className="border border-black px-4 py-2"
                          >
                            {renderCell(row, car, field.key)}
                          </td>
                        ))
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

export default RentalTariffRateCard;
