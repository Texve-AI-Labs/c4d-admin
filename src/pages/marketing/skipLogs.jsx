import React, { useEffect, useState } from "react";
import { Button, Card, CardBody, Input, Option, Select, Spinner, Typography } from "@material-tailwind/react";
import moment from "moment";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { API_ROUTES, ColorStyles } from "@/utils/constants";

const INITIAL_FILTERS = {
  fromDate: "",
  toDate: "",
  userType: "ALL",
  screen: "ALL",
};

const formatDateTime = (value) => {
  if (!value) return "-";
  const parsed = moment(value);
  if (!parsed.isValid()) return String(value);
  return parsed.format("DD-MM-YYYY hh:mm A");
};

const SKIP_LOG_COLUMNS = [
  { key: "watchTime", label: "Watch Date & Time", getValue: (item) => formatDateTime(item?.created_at) },
  { key: "zone", label: "Zone", getValue: (item) => item?.context?.zone || "-" },
  { key: "userType", label: "User Type", getValue: (item) => item?.userType || "-" },
  { key: "userId", label: "User ID", getValue: (item) => item?.userId || "-" },
  { key: "userName", label: "User Name", getValue: (item) => item?.userDetails?.firstName || "-" },
  { key: "phoneNumber", label: "Phone Number", getValue: (item) => item?.userDetails?.phoneNumber || "-" },
  { key: "platform", label: "Platform", getValue: (item) => item?.platform || "-" },
  { key: "appVersion", label: "App Version", getValue: (item) => item?.appVersion || "-" },
  { key: "screen", label: "Screen", getValue: (item) => item?.screen || "-" },
  { key: "componentType", label: "Component Type", getValue: (item) => item?.componentType || "-" },
  { key: "componentKey", label: "Component Key", getValue: (item) => item?.componentKey || "-" },
];

function SkipLogs() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 15,
  });

  const buildQuery = (page = 1, activeFilters = filters) => {
    const pages = {
      page,
      limit: pagination.itemsPerPage,
    };

    Object.entries(activeFilters).forEach(([key, value]) => {
      const normalizedValue = String(value || "").trim();
      if (normalizedValue && normalizedValue !== "ALL") {
        pages[key] = normalizedValue;
      }
    });

    return pages;
  };

  const fetchSkipLogs = async (page = 1, activeFilters = filters) => {
    setLoading(true);
    try {
      const response = await ApiRequestUtils.getWithQueryParam(API_ROUTES.GET_SKIP_EVENTS, buildQuery(page, activeFilters));
      if (response?.success) {
        const records = Array.isArray(response?.data) ? response.data : [];
        setRows(records);
        setPagination((prev) => ({
          ...prev,
          currentPage: response?.pagination?.currentPage || page,
          totalPages: response?.pagination?.totalPages || 1,
          totalItems: response?.pagination?.totalItems || 0,
          itemsPerPage: response?.pagination?.itemsPerPage || prev.itemsPerPage,
        }));
      } else {
        setRows([]);
      }
    } catch (error) {
      console.error("Failed to fetch skip logs:", error);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSkipLogs(1);
  }, []);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleSearch = () => {
    fetchSkipLogs(1);
  };

  const handleClear = () => {
    const clearedFilters = { ...INITIAL_FILTERS };
    setFilters(clearedFilters);
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
    setRows([]);
    fetchSkipLogs(1, clearedFilters);
  };

  const handlePageChange = (nextPage) => {
    if (nextPage < 1 || nextPage > pagination.totalPages || loading) return;
    fetchSkipLogs(nextPage);
  };

  const generatePageButtons = () => {
    const buttons = [];
    const maxVisible = 5;
    let startPage = Math.max(1, pagination.currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(pagination.totalPages, startPage + maxVisible - 1);

    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    for (let i = startPage; i <= endPage; i += 1) {
      buttons.push(
        <Button
          key={i}
          size="sm"
          variant={i === pagination.currentPage ? "filled" : "outlined"}
          className={`mx-1 ${ColorStyles.bgColor} text-white`}
          onClick={() => handlePageChange(i)}
          disabled={loading}
        >
          {i}
        </Button>
      );
    }
    return buttons;
  };

  return (
    <div className="mb-8 flex flex-col gap-6">
      <Card>
        <CardBody>
          <Typography variant="h5" className="mb-1">
            Skip Logs
          </Typography>          

          <div className="mt-4 flex flex-col gap-4">
            <div className="flex flex-col gap-4 md:flex-row md:flex-nowrap md:items-end">
            <div className="w-full md:w-52">
              <Input type="date" label="From Date" value={filters.fromDate} onChange={(e) => handleFilterChange("fromDate", e.target.value)} />
            </div>
            <div className="w-full md:w-52">
              <Input type="date" label="To Date" value={filters.toDate} onChange={(e) => handleFilterChange("toDate", e.target.value)} />
            </div>
            <div className="w-full md:w-52">
              <Typography variant="small" className="mb-1 text-blue-gray-700">
                User Type
              </Typography>
              <Select value={filters.userType} onChange={(value) => handleFilterChange("userType", value || "ALL")}>
                <Option value="ALL">All</Option>
                <Option value="DRIVER">DRIVER</Option>
                <Option value="CUSTOMER">CUSTOMER</Option>
              </Select>
            </div>
            <div className="w-full md:w-72 lg:w-96">
              <Typography variant="small" className="mb-1 text-blue-gray-700">
                Screen
              </Typography>
              <Select
                value={filters.screen}
                onChange={(value) => handleFilterChange("screen", value || "ALL")}
                selected={(element) => element?.props?.children || "All"}
              >
                <Option value="ALL">All</Option>
                <Option value="Home">Home</Option>
                <Option value="RideTripRequest">RideTripRequest</Option>
                <Option value="RideSelectionEstimationPage">RideSelectionEstimationPage</Option>
                <Option value="PaymentSummaryModal">PaymentSummaryModal</Option>
                <Option value="RidesTripDetails">RidesTripDetails</Option>
                <Option value="Feedback">Feedback</Option>
                <Option value="RentalDropTaxiBooking">RentalDropTaxiBooking</Option>
                <Option value="Rides">Rides</Option>
                <Option value="TripEnded">TripEnded</Option>
                <Option value="RentalOutstationBooking">RentalOutstationBooking</Option>
                <Option value="AutoBooking">AutoBooking</Option>
                <Option value="RidesBooking">RidesBooking</Option>
                <Option value="ReturnTripTab">ReturnTripTab</Option>
                <Option value="Tier">Tier</Option>
                <Option value="NotificationUpdates">NotificationUpdates</Option>
                <Option value="ReturnTripDeals">ReturnTripDeals</Option>
                <Option value="TripDetails">TripDetails</Option>
                <Option value="StartTrip">StartTrip</Option>
                <Option value="ParcelBooking">ParcelBooking</Option>
                <Option value="HomeScreen">HomeScreen</Option>
                <Option value="RidesDriverSearch">RidesDriverSearch</Option>
                <Option value="SelectActingDriver">SelectActingDriver</Option>
                <Option value="InsuranceVerification">InsuranceVerification</Option>
                <Option value="AadharCardVerification">AadharCardVerification</Option>
                <Option value="LaterBookingTripConfirmation">LaterBookingTripConfirmation</Option>
                <Option value="RentalHourlyPackageBooking">RentalHourlyPackageBooking</Option>
                <Option value="WalletTransaction">WalletTransaction</Option>
                <Option value="NewCustomerIntro">NewCustomerIntro</Option>
                <Option value="SignOutModal">SignOutModal</Option>
                <Option value="RideSummaryModal">RideSummaryModal</Option>
                <Option value="SubscriptionList">SubscriptionList</Option>
              </Select>
            </div>
            </div>
            <div className="flex w-full gap-2 md:w-auto">
              <Button onClick={handleSearch} disabled={loading} className={`${ColorStyles.bgColor} w-full md:w-auto`}>
              {loading ? "Loading..." : "Search"}
            </Button>
            <Button variant="outlined" onClick={handleClear} disabled={loading} className="w-full md:w-auto">
              Clear
            </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="overflow-x-auto p-0">
          {loading ? (
            <div className="flex min-h-[200px] items-center justify-center">
              <Spinner />
            </div>
          ) : (
            <>
              <div className="space-y-3 p-3 md:hidden">
                {rows.length ? (
                  rows.map((item, index) => (
                    <div className="rounded-lg border border-blue-gray-100 p-3" key={item?.id || item?._id || `${item?.userId || "row"}-${index}`}>
                      <p className="text-xs text-blue-gray-500">{SKIP_LOG_COLUMNS[0].getValue(item)}</p>
                      <p className="mt-1 text-sm font-medium text-blue-gray-900">{SKIP_LOG_COLUMNS[8].getValue(item)}</p>
                      <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-blue-gray-700">
                        <span>User: {SKIP_LOG_COLUMNS[2].getValue(item)}</span>
                        <span>Zone: {SKIP_LOG_COLUMNS[1].getValue(item)}</span>
                        <span>User ID: {SKIP_LOG_COLUMNS[3].getValue(item)}</span>
                        <span>Name: {SKIP_LOG_COLUMNS[4].getValue(item)}</span>
                        <span>Phone: {SKIP_LOG_COLUMNS[5].getValue(item)}</span>
                        <span>Platform: {SKIP_LOG_COLUMNS[6].getValue(item)}</span>
                        <span>App: {SKIP_LOG_COLUMNS[7].getValue(item)}</span>
                        <span>Type: {SKIP_LOG_COLUMNS[9].getValue(item)}</span>
                        <span className="col-span-2">Key: {SKIP_LOG_COLUMNS[10].getValue(item)}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-2 py-6 text-center text-sm text-gray-500">No skip logs found.</div>
                )}
              </div>

              <table className="hidden w-full min-w-[1200px] table-auto whitespace-nowrap md:table">
              <thead>
                <tr className={`border-b text-left ${ColorStyles.bgColor}`}>
                  {SKIP_LOG_COLUMNS.map((column) => (
                    <th key={column.key} className="px-4 py-3 text-sm font-semibold text-white">
                      {column.label}
                    </th>
                  ))}
                  {/* <th className="px-4 py-3 text-sm font-semibold text-white">Skip Action</th> */}
                </tr>
              </thead>
              <tbody>
                {rows.length ? (
                  rows.map((item, index) => (
                    <tr className="border-b" key={item?.id || item?._id || `${item?.userId || "row"}-${index}`}>
                      {SKIP_LOG_COLUMNS.map((column) => (
                        <td
                          key={column.key}
                          className={`px-4 py-3 text-sm ${column.key === "userId" ? "font-medium text-black" : ""}`}
                        >
                          {column.getValue(item)}
                        </td>
                      ))}
                      {/* <td className="px-4 py-3 text-sm">{item?.skipAction || "-"}</td> */}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={SKIP_LOG_COLUMNS.length} className="px-4 py-8 text-center text-sm text-gray-500">
                      No skip logs found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            </>
          )}
        </CardBody>
      </Card>

      {rows.length > 0 && (
      <div className="mt-2 flex flex-col items-center gap-2">        
        <div className="flex flex-wrap items-center justify-center">
            <Button
              size="sm"
              variant="text"
              disabled={pagination.currentPage === 1 || loading}
              onClick={() => handlePageChange(pagination.currentPage - 1)}
              className="mx-1"
            >
              {"<"}
            </Button>
            {generatePageButtons()}
            <Button
              size="sm"
              variant="text"
              disabled={pagination.currentPage === pagination.totalPages || loading}
              onClick={() => handlePageChange(pagination.currentPage + 1)}
              className="mx-1"
            >
              {">"}
            </Button>
          </div>
      </div>
      )}
    </div>
  );
}

export default SkipLogs;