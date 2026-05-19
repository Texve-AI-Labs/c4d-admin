import React, { useEffect, useMemo, useState } from "react";
import { Card, CardBody, Typography } from "@material-tailwind/react";
import Chart from "react-apexcharts";
import Select from "react-select";
import { API_ROUTES } from "@/utils/constants";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";

const SERVICE_TYPE_OPTIONS = [
  { value: "ALL", label: "All" },
  { value: "HOURLY_PACKAGE", label: "Hourly Package" },
  { value: "DROP_TAXI", label: "Drop Taxi" },
  { value: "OUTSTATION", label: "Outstation" },
  { value: "RIDES", label: "Rides" },
  { value: "AUTO", label: "Auto" },
  { value: "PARCEL", label: "Parcel" },
  { value: "ACTING_DRIVER", label: "Acting Driver" },
];

const UniqueBookingsCounts = ({ filterParams }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [serviceType, setServiceType] = useState("ALL");
  const [response, setResponse] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = {
          filterType: filterParams?.filterType || "daily",
          serviceType,
          startDate: filterParams?.date,
          zone: filterParams?.zone,
        };

        const res = await ApiRequestUtils.getWithQueryParam(API_ROUTES.GET_BOOKING_FUNNEL, params);

        if (!res?.success) {
          setError("Failed to load unique bookings counts.");
          setResponse(null);
          return;
        }
        setResponse(res?.data || null);
      } catch (err) {
        console.error("Error fetching booking funnel unique bookings:", err);
        setError("Failed to load unique bookings counts.");
        setResponse(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filterParams?.filterType, filterParams?.date, filterParams?.zone, serviceType]);

  const chartPayload = response || {};
  const xField = chartPayload?.xAxis?.field || "timeSlot";
  const yLabel = chartPayload?.yAxis?.label || "Count";
  const rows = Array.isArray(chartPayload?.data) ? chartPayload.data : [];
  const seriesConfig = Array.isArray(chartPayload?.series) ? chartPayload.series : [];

  const categories = useMemo(
    () => rows.map((row) => String(row?.[xField] ?? "")),
    [rows, xField]
  );

  const series = useMemo(
    () =>
      seriesConfig.map((cfg) => ({
        name: cfg?.name || cfg?.field || "Series",
        data: rows.map((row) => Number(row?.[cfg?.field] ?? 0)),
      })),
    [seriesConfig, rows]
  );

  const chartConfig = {
    type: "area",
    height: 340,
    options: {
      chart: {
        toolbar: { show: false },
        zoom: { enabled: false },
      },
      stroke: {
        curve: "smooth",
        width: 3,
      },
      dataLabels: {
        enabled: false,
      },
      xaxis: {
        categories,
        title: { text: chartPayload?.xAxis?.label || "Date" },
      },
      yaxis: {
        title: { text: yLabel },
        labels: {
          formatter: (val) => `${Math.round(val)}`,
        },
      },
      grid: {
        strokeDashArray: 4,
      },
      tooltip: {
        y: {
          formatter: (val) => `${val}`,
        },
      },
      legend: {
        show: true,
        position: "bottom",
      },
    },
    series,
  };

  const pointsCount = categories?.length || 0;
  const minChartWidth = Math.min(Math.max(pointsCount * 70, 600), 1800);

  return (
    <Card className="border border-blue-gray-100 shadow-sm rounded-2xl">
      <CardBody className="p-4 sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between mb-3">
          <Typography variant="h6" className="text-gray-900">
            {chartPayload?.title || "Booking Funnel by Stage"}
          </Typography>
          <div className="w-full sm:w-60">
            <Select
              classNamePrefix="unique-bookings-service-type"
              options={SERVICE_TYPE_OPTIONS}
              value={SERVICE_TYPE_OPTIONS.find((opt) => opt.value === serviceType)}
              onChange={(opt) => setServiceType(opt?.value || "ALL")}
              isSearchable={false}
              menuPortalTarget={document.body}
              styles={{
                menuPortal: (base) => ({ ...base, zIndex: 40 }),
                control: (base) => ({
                  ...base,
                  minHeight: 32,
                  borderRadius: 9999,
                  fontSize: 12,
                }),
              }}
            />
          </div>
        </div>

        {error && <p className="text-sm text-red-500 mb-3">{error}</p>}

        {loading ? (
          <p className="text-sm text-gray-500">Loading unique bookings counts...</p>
        ) : categories.length === 0 || series.length === 0 ? (
          <p className="text-sm text-gray-500">No data available for selected filters.</p>
        ) : (
          <div className="w-full overflow-x-auto">
            <div style={{ minWidth: `${minChartWidth}px` }}>
              <Chart {...chartConfig} />
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
};

export default UniqueBookingsCounts;
