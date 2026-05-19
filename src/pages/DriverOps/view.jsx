import React, { useEffect, useState } from "react";
import { API_ROUTES, MONTH_LIST } from "@/utils/constants";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import HourlyOnlineDriverAvailability from "./hourlyOnlineDriverAvail";
import DriverCabsTripCompletion from "./driverCabsTripCompletion";
import HourlyLocalTripDemandLine from "./hourlyLocalTripDemandLine";
import TripTypeDemandTimeOfDayLine from "./tripTypeDemandTimeOfDayLine";
import IndividualDriverTargetAchievement from "./IndividualDriverTargetAchievement";
import AreaWiseHourlyDemandLocal from "./areaWiseHourlyDemandLocal";
import AreaWiseHourlyDemandDrop from "./areaWiseHourlyDemandDrop";
import AreaWiseHourlyDemandOutstation from "./areaWiseHourlyDemandOutstation";
import AreaWiseTripTypeShareBar from "./areaWiseTripTypeShareBar";
import DriverTransactionsChart from "./driverTransactionsChart";
import DriverTransactionsTable from"./driverTransactionsTable";
import UniqueBookingsCounts from "./uniqueBookingsCounts";
import { Typography } from "@material-tailwind/react";
import Select from "react-select";

const FILTER_TYPE_OPTIONS = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

// For Dashboard 4, only Daily and Weekly are allowed
const DASHBOARD4_FILTER_TYPE_OPTIONS = FILTER_TYPE_OPTIONS.filter(
  (opt) => opt.value !== "monthly"
);

const DriverOpsView = () => {
  const today = new Date().toISOString().split("T")[0];
  const [serviceAreas, setServiceAreas] = useState([]);
  const [zone, setZone] = useState("");
  const currentYear = new Date().getFullYear();
  const currentMonth = String(new Date().getMonth() + 1).padStart(2, "0");
  // Dashboard 1 filters (Supply & Availability)

  const [d1FilterType, setD1FilterType] = useState("daily");
  const [d1Date, setD1Date] = useState(today);
  const [d1Month, setD1Month] = useState(currentMonth);
  const [d1Year, setD1Year] = useState(String(currentYear));
  // Dashboard 2 filters (Driver Performance)

  const [d2FilterType, setD2FilterType] = useState("daily");
  const [d2Date, setD2Date] = useState(today);
  const [d2Month, setD2Month] = useState(currentMonth);
  const [d2Year, setD2Year] = useState(String(currentYear));
  // Dashboard 3 filters (Demand & Booking Pattern)

  const [d3FilterType, setD3FilterType] = useState("daily");
  const [d3Date, setD3Date] = useState(today);
  const [d3Month, setD3Month] = useState(currentMonth);
  const [d3Year, setD3Year] = useState(String(currentYear));

  // Dashboard 4 filters (Area-wise Hourly Demand)
  const [d4FilterType, setD4FilterType] = useState("daily");
  const [d4Date, setD4Date] = useState(today);
  const [d4Month, setD4Month] = useState(currentMonth);
  const [d4Year, setD4Year] = useState(String(currentYear));

  // Area-wise Trip Type Share (Bar) filters – separate from heatmaps
  const [d4BarFilterType, setD4BarFilterType] = useState("daily");
  const [d4BarDate, setD4BarDate] = useState(today);
  const [d4BarMonth, setD4BarMonth] = useState(currentMonth);
  const [d4BarYear, setD4BarYear] = useState(String(currentYear));
  const [d6FilterType, setD6FilterType] = useState("daily");
  const [d6Date, setD6Date] = useState(today);
  const [d6Month, setD6Month] = useState(currentMonth);
  const [d6Year, setD6Year] = useState(String(currentYear));
  const [error, setError] = useState(null);

  const fetchGeoData = async () => {
    try {
      const response = await ApiRequestUtils.getWithQueryParam(API_ROUTES.GEO_MARKINGS_LIST,
        {
          type: "Service Area",
        }
      );
      const filteredAreas = (response.data || []).filter(
        (area) => area.type === "Service Area"
      );
      setServiceAreas(filteredAreas || []);

      if (filteredAreas && filteredAreas.length > 0) {
        // Default zone safely: prefer 4th item if it exists, otherwise first
        const defaultArea =
          filteredAreas[3] || filteredAreas[0];
        setZone((prev) => prev || defaultArea.name);
      }
    } catch (err) {
      console.error("Error fetching GEO_MARKINGS_LIST:", err);
      setError("Failed to fetch service areas. Please try again.");
    }
  };

  useEffect(() => {
    fetchGeoData();
  }, []);

  const MONTH_OPTIONS = MONTH_LIST.map((m) => {
    const monthIndex = parseInt(m.value, 10) - 1;
    const monthName = new Date(2000, monthIndex, 1).toLocaleString("en-US", {
      month: "long",
    });
    return {
      value: m.value,
      label: monthName,
    };
  });

  const ZONE_OPTIONS = [
    ...serviceAreas.map((area) => ({
      value: area.name,
      label: area.name,
    })),
  ];

  const buildFilterParams = (filterType, date, month, year) =>
    filterType === "monthly"
      ? { filterType, date: `${year}-${month}-01`, zone }
      : { filterType, date, zone };

  return (
    <div className="mb-8 flex flex-col gap-6 bg-gray-50 px-2 sm:px-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between bg-white rounded-md p-3 sm:p-4 mt-2">
        <h1 className="text-2xl font-semibold">
          <span className="text-primary">Driver Analytics</span>
        </h1>
        <div className="flex flex-wrap gap-2 md:justify-end font-normal w-full md:w-auto">
          <div className="w-full sm:w-auto min-w-[140px]">
            <Select
              options={ZONE_OPTIONS}
              value={ZONE_OPTIONS.find((opt) => opt.value === zone)}
              onChange={(opt) => setZone(opt?.value || "")}
              classNamePrefix="zone-select"
              menuPortalTarget={document.body}
              styles={{
                menuPortal: (base) => ({ ...base, zIndex: 40 }),
                control: (base) => ({
                  ...base,
                  minHeight: 36,
                  borderRadius: 12,
                  fontSize: 14,
                }),
              }}
              isSearchable={false}
            />
          </div>
        </div>
      </div>

      {error && (
        <p className="text-xs text-red-500 text-right mt-1">{error}</p>
      )}

      <div className="p-2 space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-2">
          <Typography className="text-gray-700 text-lg font-medium">
            Dashboard 1: Supply & Availability
          </Typography>
          <div className="flex flex-col sm:flex-row flex-wrap gap-2 items-stretch sm:items-center">
            <div className="inline-flex rounded-full bg-gray-100 p-1 w-fit">
              <button
                type="button"
                onClick={() => setD1FilterType("daily")}
                className={`px-3 py-1 text-xs font-medium rounded-full ${d1FilterType === "daily"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-transparent text-gray-700"
                  }`}
              >
                Daily
              </button>
              <button
                type="button"
                onClick={() => setD1FilterType("weekly")}
                className={`px-3 py-1 text-xs font-medium rounded-full ${d1FilterType === "weekly"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-transparent text-gray-700"
                  }`}
              >
                Weekly
              </button>
              <button
                type="button"
                onClick={() => setD1FilterType("monthly")}
                className={`px-3 py-1 text-xs font-medium rounded-full ${d1FilterType === "monthly"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-transparent text-gray-700"
                  }`}
              >
                Monthly
              </button>
            </div>
            {d1FilterType === "monthly" ? (
              <>
                <div className="w-full sm:w-auto min-w-[140px]">
                  <Select
                    options={MONTH_OPTIONS}
                    value={MONTH_OPTIONS.find((opt) => opt.value === d1Month)}
                    onChange={(opt) =>
                      setD1Month(
                        opt?.value ||
                        String(new Date().getMonth() + 1).padStart(2, "0")
                      )
                    }
                    classNamePrefix="month-select"
                    menuPortalTarget={document.body}
                    styles={{
                      menuPortal: (base) => ({ ...base, zIndex: 40 }),
                      control: (base) => ({
                        ...base,
                        minHeight: 32,
                        borderRadius: 12,
                        fontSize: 14,
                      }),
                    }}
                    isSearchable={false}
                  />
                </div>
                <input
                  type="number"
                  value={d1Year}
                  onChange={(e) => setD1Year(e.target.value)}
                  min="1990"
                  max="2100"
                  className="w-full sm:w-24 rounded-xl border border-gray-300 bg-gray-50 px-3 py-1.5 text-xs focus:outline-none focus:border-primary"
                />
              </>
            ) : (
              <input
                type="date"
                value={d1Date}
                onChange={(e) => setD1Date(e.target.value)}
                className="w-full sm:w-auto rounded-xl border border-gray-300 bg-gray-50 px-3 py-1.5 text-xs focus:outline-none focus:border-primary hidden"
              />
            )}
          </div>
        </div>
        <HourlyOnlineDriverAvailability filterParams={buildFilterParams(d1FilterType,d1Date,d1Month,d1Year)} />
        <DriverCabsTripCompletion filterParams={buildFilterParams(d1FilterType,d1Date,d1Month,d1Year)} />
      </div>
      <div className="p-2 space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-2">
          <Typography className="text-gray-700 text-lg font-medium">
            Dashboard 2: Driver Performance
          </Typography>
          <div className="flex flex-col sm:flex-row flex-wrap gap-2 items-stretch sm:items-center">
            <div className="inline-flex rounded-full bg-gray-100 p-1 w-fit">
              <button
                type="button"
                onClick={() => setD2FilterType("daily")}
                className={`px-3 py-1 text-xs font-medium rounded-full ${d2FilterType === "daily"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-transparent text-gray-700"
                  }`}
              >
                Daily
              </button>
              <button
                type="button"
                onClick={() => setD2FilterType("weekly")}
                className={`px-3 py-1 text-xs font-medium rounded-full ${d2FilterType === "weekly"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-transparent text-gray-700"
                  }`}
              >
                Weekly
              </button>
              <button
                type="button"
                onClick={() => setD2FilterType("monthly")}
                className={`px-3 py-1 text-xs font-medium rounded-full ${d2FilterType === "monthly"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-transparent text-gray-700"
                  }`}
              >
                Monthly
              </button>
            </div>
            {d2FilterType === "monthly" ? (
              <>
                <div className="w-full sm:w-auto min-w-[140px]">
                  <Select
                    options={MONTH_OPTIONS}
                    value={MONTH_OPTIONS.find((opt) => opt.value === d2Month)}
                    onChange={(opt) =>
                      setD2Month(
                        opt?.value ||
                        String(new Date().getMonth() + 1).padStart(2, "0")
                      )
                    }
                    classNamePrefix="month-select"
                    menuPortalTarget={document.body}
                    styles={{
                      menuPortal: (base) => ({ ...base, zIndex: 40 }),
                      control: (base) => ({
                        ...base,
                        minHeight: 32,
                        borderRadius: 12,
                        fontSize: 14,
                      }),
                    }}
                    isSearchable={false}
                  />
                </div>
                <input
                  type="number"
                  value={d2Year}
                  onChange={(e) => setD2Year(e.target.value)}
                  min="1990"
                  max="2100"
                  className="w-full sm:w-24 rounded-xl border border-gray-300 bg-gray-50 px-3 py-1.5 text-xs focus:outline-none focus:border-primary"
                />
              </>
            ) : (
              <input
                type="date"
                value={d2Date}
                onChange={(e) => setD2Date(e.target.value)}
                className="w-full sm:w-auto rounded-xl border border-gray-300 bg-gray-50 px-3 py-1.5 text-xs focus:outline-none focus:border-primary hidden"
              />
            )}
          </div>
        </div>
        <IndividualDriverTargetAchievement
          filterParams={buildFilterParams(
            d2FilterType,
            d2Date,
            d2Month,
            d2Year
          )}
        />
      </div>
      <div className="p-2 space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-2">
          <Typography className="text-gray-700 text-lg font-medium">
            Dashboard 3: Demand & Booking Pattern
          </Typography>
          <div className="flex flex-col sm:flex-row flex-wrap gap-2 items-stretch sm:items-center">
            <div className="inline-flex rounded-full bg-gray-100 p-1 w-fit">
              <button
                type="button"
                onClick={() => setD3FilterType("daily")}
                className={`px-3 py-1 text-xs font-medium rounded-full ${d3FilterType === "daily"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-transparent text-gray-700"
                  }`}
              >
                Daily
              </button>
              <button
                type="button"
                onClick={() => setD3FilterType("weekly")}
                className={`px-3 py-1 text-xs font-medium rounded-full ${d3FilterType === "weekly"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-transparent text-gray-700"
                  }`}
              >
                Weekly
              </button>
              <button
                type="button"
                onClick={() => setD3FilterType("monthly")}
                className={`px-3 py-1 text-xs font-medium rounded-full ${d3FilterType === "monthly"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-transparent text-gray-700"
                  }`}
              >
                Monthly
              </button>
            </div>
            {d3FilterType === "monthly" ? (
              <>
                <div className="w-full sm:w-auto min-w-[140px]">
                  <Select
                    options={MONTH_OPTIONS}
                    value={MONTH_OPTIONS.find((opt) => opt.value === d3Month)}
                    onChange={(opt) =>
                      setD3Month(
                        opt?.value ||
                        String(new Date().getMonth() + 1).padStart(2, "0")
                      )
                    }
                    classNamePrefix="month-select"
                    menuPortalTarget={document.body}
                    styles={{
                      menuPortal: (base) => ({ ...base, zIndex: 40 }),
                      control: (base) => ({
                        ...base,
                        minHeight: 32,
                        borderRadius: 12,
                        fontSize: 14,
                      }),
                    }}
                    isSearchable={false}
                  />
                </div>
                <input
                  type="number"
                  value={d3Year}
                  onChange={(e) => setD3Year(e.target.value)}
                  min="1990"
                  max="2100"
                  className="w-full sm:w-24 rounded-xl border border-gray-300 bg-gray-50 px-3 py-1.5 text-xs focus:outline-none focus:border-primary"
                />
              </>
            ) : (
              <input
                type="date"
                value={d3Date}
                onChange={(e) => setD3Date(e.target.value)}
                className="w-full sm:w-auto rounded-xl border border-gray-300 bg-gray-50 px-3 py-1.5 text-xs focus:outline-none focus:border-primary hidden"
              />
            )}
          </div>
        </div>
        <HourlyLocalTripDemandLine
          filterParams={buildFilterParams(
            d3FilterType,
            d3Date,
            d3Month,
            d3Year
          )}
        />
        <TripTypeDemandTimeOfDayLine
          filterParams={buildFilterParams(
            d3FilterType,
            d3Date,
            d3Month,
            d3Year
          )}
        />
      </div>
      <div className="p-2 space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-2">
          <Typography className="text-gray-700 text-lg font-medium">
            Dashboard 4: Area-Wise Hourly Demand Analysis
          </Typography>
          <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
            {/* Simple Daily / Weekly toggle for heatmaps */}
            <div className="inline-flex rounded-full bg-gray-100 p-1 w-fit">
              <button
                type="button"
                onClick={() => setD4FilterType("daily")}
                className={`px-3 py-1 text-xs font-medium rounded-full ${d4FilterType === "daily"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-transparent text-gray-700"
                  }`}
              >
                Daily
              </button>
              <button
                type="button"
                onClick={() => setD4FilterType("weekly")}
                className={`px-3 py-1 text-xs font-medium rounded-full ${d4FilterType === "weekly"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-transparent text-gray-700"
                  }`}
              >
                Weekly
              </button>
            </div>
            <input
              type="date"
              value={d4Date}
              onChange={(e) => setD4Date(e.target.value)}
              className="w-full sm:w-auto rounded-xl border border-gray-300 bg-gray-50 px-3 py-1.5 text-xs focus:outline-none focus:border-primary hidden"
            />
          </div>
        </div>
        <AreaWiseHourlyDemandLocal
          filterParams={buildFilterParams(
            d4FilterType,
            d4Date,
            d4Month,
            d4Year
          )}
        />
        <AreaWiseHourlyDemandDrop
          filterParams={buildFilterParams(
            d4FilterType,
            d4Date,
            d4Month,
            d4Year
          )}
        />
        <AreaWiseHourlyDemandOutstation
          filterParams={buildFilterParams(
            d4FilterType,
            d4Date,
            d4Month,
            d4Year
          )}
        />
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <Typography className="text-gray-700 text-sm font-medium">
            Area-wise Trip Type Share Filters
          </Typography>
          <div className="flex flex-col sm:flex-row flex-wrap gap-2 items-stretch sm:items-center">
            <div className="inline-flex rounded-full bg-gray-100 p-1 w-fit">
              <button
                type="button"
                onClick={() => setD4BarFilterType("daily")}
                className={`px-3 py-1 text-xs font-medium rounded-full ${d4BarFilterType === "daily"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-transparent text-gray-700"
                  }`}
              >
                Daily
              </button>
              <button
                type="button"
                onClick={() => setD4BarFilterType("weekly")}
                className={`px-3 py-1 text-xs font-medium rounded-full ${d4BarFilterType === "weekly"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-transparent text-gray-700"
                  }`}
              >
                Weekly
              </button>
              <button
                type="button"
                onClick={() => setD4BarFilterType("monthly")}
                className={`px-3 py-1 text-xs font-medium rounded-full ${d4BarFilterType === "monthly"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-transparent text-gray-700"
                  }`}
              >
                Monthly
              </button>
            </div>
            {d4BarFilterType === "monthly" ? (
              <>
                <div className="w-full sm:w-auto min-w-[140px]">
                  <Select
                    options={MONTH_OPTIONS}
                    value={MONTH_OPTIONS.find(
                      (opt) => opt.value === d4BarMonth
                    )}
                    onChange={(opt) =>
                      setD4BarMonth(
                        opt?.value ||
                        String(new Date().getMonth() + 1).padStart(2, "0")
                      )
                    }
                    classNamePrefix="month-select"
                    menuPortalTarget={document.body}
                    styles={{
                      menuPortal: (base) => ({ ...base, zIndex: 40 }),
                      control: (base) => ({
                        ...base,
                        minHeight: 32,
                        borderRadius: 12,
                        fontSize: 14,
                      }),
                    }}
                    isSearchable={false}
                  />
                </div>
                <input
                  type="number"
                  value={d4BarYear}
                  onChange={(e) => setD4BarYear(e.target.value)}
                  min="1990"
                  max="2100"
                  className="w-full sm:w-24 rounded-xl border border-gray-300 bg-gray-50 px-3 py-1.5 text-xs focus:outline-none focus:border-primary"
                />
              </>
            ) : (
              <input
                type="date"
                value={d4BarDate}
                onChange={(e) => setD4BarDate(e.target.value)}
                className="w-full sm:w-auto rounded-xl border border-gray-300 bg-gray-50 px-3 py-1.5 text-xs focus:outline-none focus:border-primary hidden"
              />
            )}
          </div>
        </div>
        <AreaWiseTripTypeShareBar
          filterParams={buildFilterParams(
            d4BarFilterType,
            d4BarDate,
            d4BarMonth,
            d4BarYear
          )}
        />
      </div>
      <div className="p-2 space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-2">
          <Typography className="text-gray-700 text-lg font-medium">
            Dashboard 5: Transactions
          </Typography>          
        </div>
        <DriverTransactionsChart />
        <DriverTransactionsTable />
      </div>
      <div className="p-2 space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-2">
            <Typography className="text-gray-700 text-lg font-medium">
              Dashboard 6: Unique Bookings 
            </Typography>
            <div className="flex flex-col sm:flex-row flex-wrap gap-2 items-stretch sm:items-center">
              <div className="inline-flex rounded-full bg-gray-100 p-1 w-fit">
                <button
                  type="button"
                  onClick={() => setD6FilterType("daily")}
                  className={`px-3 py-1 text-xs font-medium rounded-full ${d6FilterType === "daily"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-transparent text-gray-700"
                    }`}
                >
                  Daily
                </button>
                <button
                  type="button"
                  onClick={() => setD6FilterType("weekly")}
                  className={`px-3 py-1 text-xs font-medium rounded-full ${d6FilterType === "weekly"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-transparent text-gray-700"
                    }`}
                >
                  Weekly
                </button>
                <button
                  type="button"
                  onClick={() => setD6FilterType("monthly")}
                  className={`px-3 py-1 text-xs font-medium rounded-full ${d6FilterType === "monthly"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-transparent text-gray-700"
                    }`}
                >
                  Monthly
                </button>
              </div>
              {d6FilterType === "monthly" ? (
                <>
                  <div className="w-full sm:w-auto min-w-[140px]">
                    <Select
                      options={MONTH_OPTIONS}
                      value={MONTH_OPTIONS.find((opt) => opt.value === d6Month)}
                      onChange={(opt) =>
                        setD6Month(
                          opt?.value ||
                          String(new Date().getMonth() + 1).padStart(2, "0")
                        )
                      }
                      classNamePrefix="month-select"
                      menuPortalTarget={document.body}
                      styles={{
                        menuPortal: (base) => ({ ...base, zIndex: 40 }),
                        control: (base) => ({
                          ...base,
                          minHeight: 32,
                          borderRadius: 12,
                          fontSize: 14,
                        }),
                      }}
                      isSearchable={false}
                    />
                  </div>
                  <input
                    type="number"
                    value={d6Year}
                    onChange={(e) => setD6Year(e.target.value)}
                    min="1990"
                    max="2100"
                    className="w-full sm:w-24 rounded-xl border border-gray-300 bg-gray-50 px-3 py-1.5 text-xs focus:outline-none focus:border-primary"
                  />
                </>
              ) : (
                <input
                  type="date"
                  value={d6Date}
                  onChange={(e) => setD6Date(e.target.value)}
                  className="w-full sm:w-auto rounded-xl border border-gray-300 bg-gray-50 px-3 py-1.5 text-xs focus:outline-none focus:border-primary hidden"
                />
              )}
            </div>
          </div>
          <UniqueBookingsCounts
            filterParams={buildFilterParams(d6FilterType, d6Date, d6Month, d6Year)}
          />
      </div>
    </div>
  );
};

export default DriverOpsView;