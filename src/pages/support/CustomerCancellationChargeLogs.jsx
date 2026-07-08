import React, { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Input,
  Option,
  Select,
  Spinner,
  Typography,
} from "@material-tailwind/react";
import moment from "moment";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { API_ROUTES, ColorStyles } from "@/utils/constants";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/solid";

const DEFAULT_PAGE_SIZE = 20;
const SERVICE_TYPE_OPTIONS = ["", "RIDES", "AUTO", "PARCEL", "DRIVER", "RENTAL"];

const normalizeRows = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.rows)) return payload.rows;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.logs)) return payload.logs;
  return [];
};

const getRecord = (row) => row?.booking || row?.Booking || row?.bookingDetails || row?.bookingRelation || row || {};

const formatValue = (value) => {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "object") {
    return value?.name || value?.fullName || value?.bookingNumber || value?.id || "-";
  }
  return String(value);
};

const formatDateTime = (value) => {
  if (!value) return "-";
  const parsed = moment(value);
  if (!parsed.isValid()) return String(value);
  return parsed.format("DD-MM-YYYY hh:mm A");
};

const resolvePagination = (response, rows, fallbackPage, fallbackLimit) => {
  const pagination = response?.pagination || response?.meta || response?.data?.pagination || {};
  const totalItems = Number(pagination.totalItems || pagination.total || pagination.count || rows.length || 0);
  const limit = Number(pagination.itemsPerPage || pagination.limit || fallbackLimit || DEFAULT_PAGE_SIZE);
  const totalPages = Number(
    pagination.totalPages || (limit > 0 ? Math.max(1, Math.ceil(totalItems / limit)) : 1)
  );
  const currentPage = Number(pagination.currentPage || pagination.page || fallbackPage || 1);
  return { currentPage, totalPages, totalItems, itemsPerPage: limit };
};

function CustomerCancellationChargeLogs() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sortOrder, setSortOrder] = useState("desc");
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: DEFAULT_PAGE_SIZE,
  });
  const [filters, setFilters] = useState({
    bookingId: "",
    serviceType: "",
    fromDate: "",
    toDate: "",
  });
  const [draftFilters, setDraftFilters] = useState(filters);

  const fetchLogs = async (page = 1, nextFilters = filters) => {
    setLoading(true);
    setError("");
    try {
      const query = {
        page,
        limit: pagination.itemsPerPage,
      };
      if (nextFilters.bookingId) query.bookingId = Number(nextFilters.bookingId);
      if (nextFilters.serviceType) query.serviceType = nextFilters.serviceType;
      if (nextFilters.fromDate) query.fromDate = nextFilters.fromDate;
      if (nextFilters.toDate) query.toDate = nextFilters.toDate;

      const response = await ApiRequestUtils.getWithQueryParam(
        API_ROUTES.CUSTOMER_CANCELLATION_CHARGE_LOGS,
        query
      );

      const payload = response?.data ?? response?.result ?? response;
      const nextRows = normalizeRows(payload);
      const nextPagination = resolvePagination(response, nextRows, page, pagination.itemsPerPage);

      setRows(nextRows);
      setPagination(nextPagination);
      if (!nextRows.length) setError("No logs found.");
    } catch (err) {
      console.error("Failed to fetch customer cancellation charge logs:", err);
      setRows([]);
      setError("Failed to fetch customer cancellation charge logs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(1, filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const sortedRows = useMemo(() => {
    const nextRows = [...rows];
    nextRows.sort((a, b) => {
      const aTime = new Date(getRecord(a)?.created_at || getRecord(a)?.createdAt || a?.created_at || a?.createdAt || 0).getTime();
      const bTime = new Date(getRecord(b)?.created_at || getRecord(b)?.createdAt || b?.created_at || b?.createdAt || 0).getTime();
      return sortOrder === "asc" ? aTime - bTime : bTime - aTime;
    });
    return nextRows;
  }, [rows, sortOrder]);

  const handleApplyFilters = () => {
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
    setFilters({
      bookingId: draftFilters.bookingId.trim(),
      serviceType: draftFilters.serviceType,
      fromDate: draftFilters.fromDate,
      toDate: draftFilters.toDate,
    });
  };

  const handleClearFilters = () => {
    const reset = {
      bookingId: "",
      serviceType: "",
      fromDate: "",
      toDate: "",
    };
    setDraftFilters(reset);
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
    setFilters(reset);
  };

  const handlePageChange = (page) => {
    if (page < 1 || page > pagination.totalPages || loading) return;
    setPagination((prev) => ({ ...prev, currentPage: page }));
    fetchLogs(page, filters);
  };

  const renderPageButtons = () => {
    const buttons = [];
    const maxVisible = 5;
    let startPage = Math.max(1, pagination.currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(pagination.totalPages, startPage + maxVisible - 1);
    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    for (let page = startPage; page <= endPage; page += 1) {
      buttons.push(
        <Button
          key={page}
          size="sm"
          variant={page === pagination.currentPage ? "filled" : "outlined"}
          className={`mx-1 ${ColorStyles.bgColor} text-white`}
          onClick={() => handlePageChange(page)}
          disabled={loading}
        >
          {page}
        </Button>
      );
    }
    return buttons;
  };

  const renderPerson = (value) => {
    if (!value) return "-";
    if (typeof value === "object") {
      return value.fullName || value.name || value.customerName || value.driverName || value.phoneNumber || value.id || "-";
    }
    return String(value);
  };

  const renderCabDetails = (record) => {
    const cab = record?.Cab || record?.cab || record?.Auto || record?.auto || record?.Parcel || record?.parcel || {};
    const label =
      cab?.vehicleNumber ||
      cab?.registrationNumber ||
      cab?.cabNumber ||
      cab?.autoNumber ||
      cab?.parcelNumber ||
      cab?.name ||
      cab?.id ||
      "-";
    return label;
  };

  return (
    <div className="mt-8 flex flex-col gap-6">
      <Card>
        <CardHeader variant="gradient" className={`mb-0 p-6 rounded-xl ${ColorStyles.bgColor}`}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <Typography variant="h6" color="white">
                Customer Cancellation Charge Logs
              </Typography>
              <Typography variant="small" color="white" className="opacity-80">
                Admin view of cancellation-charge consumption logs
              </Typography>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outlined" className="border-white text-white" onClick={handleClearFilters}>
                Clear Filters
              </Button>
              <Button size="sm" variant="filled" className="bg-white text-black" onClick={handleApplyFilters}>
                Apply Filters
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardBody className="pt-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Input
              label="Booking ID"
              type="number"
              value={draftFilters.bookingId}
              onChange={(e) => setDraftFilters((prev) => ({ ...prev, bookingId: e.target.value }))}
            />
            <Select
              label="Service Type"
              value={draftFilters.serviceType}
              onChange={(value) => setDraftFilters((prev) => ({ ...prev, serviceType: value || "" }))}
            >
              {SERVICE_TYPE_OPTIONS.map((serviceType) => (
                <Option key={serviceType || "all"} value={serviceType}>
                  {serviceType || "All"}
                </Option>
              ))}
            </Select>
            <Input
              label="From Date"
              type="date"
              value={draftFilters.fromDate}
              onChange={(e) => setDraftFilters((prev) => ({ ...prev, fromDate: e.target.value }))}
            />
            <Input
              label="To Date"
              type="date"
              value={draftFilters.toDate}
              onChange={(e) => setDraftFilters((prev) => ({ ...prev, toDate: e.target.value }))}
            />
          </div>

          {error ? (
            <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
              <Typography variant="small" className="text-gray-700">
                {error}
              </Typography>
            </div>
          ) : null}

          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[1200px] table-auto">
              <thead>
                <tr>
                  {[
                    "Log ID",
                    "Booking",
                    "Service Type",
                    "Customer",
                    "Driver",
                    "Cab / Auto / Parcel",
                    "Amount",
                    "Created At",
                    "Action",
                  ].map((label) => (
                    <th key={label} className="border-b border-blue-gray-50 py-3 px-5 text-left">
                      <div className="flex items-center">
                        <Typography variant="small" className="text-[11px] font-bold uppercase text-black">
                          {label}
                        </Typography>
                        {label === "Created At" && (
                          <button
                            type="button"
                            className="ml-1"
                            onClick={() => setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))}
                          >
                            {sortOrder === "asc" ? (
                              <ChevronUpIcon className="h-4 w-4 text-black" />
                            ) : (
                              <ChevronDownIcon className="h-4 w-4 text-black" />
                            )}
                          </button>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={9} className="py-10">
                      <div className="flex justify-center">
                        <Spinner className="h-12 w-12" />
                      </div>
                    </td>
                  </tr>
                ) : (
                  sortedRows.map((row, index) => {
                    const record = getRecord(row);
                    const logId = row?.id || row?.logId || record?.id || record?.logId || `${pagination.currentPage}-${index}`;
                    const booking = record?.Booking || record?.booking || {};
                    const customer = record?.Customer || record?.customer || booking?.Customer || booking?.customer || {};
                    const driver = record?.Driver || record?.driver || booking?.Driver || booking?.driver || {};
                    const amount = row?.amount ?? row?.chargeAmount ?? row?.consumedAmount ?? record?.amount ?? "-";
                    const createdAt = row?.created_at || row?.createdAt || record?.created_at || record?.createdAt;

                    return (
                      <tr key={logId}>
                        <td className="border-b border-blue-gray-50 py-3 px-5">
                          <Typography variant="small" className="font-semibold text-black">
                            {formatValue(logId)}
                          </Typography>
                        </td>
                        <td className="border-b border-blue-gray-50 py-3 px-5">
                          <Typography variant="small" className="font-semibold text-black">
                            {booking?.bookingNumber || booking?.id || record?.bookingId || row?.bookingId || "-"}
                          </Typography>
                        </td>
                        <td className="border-b border-blue-gray-50 py-3 px-5">
                          <Typography variant="small" className="font-semibold text-black">
                            {record?.serviceType || booking?.serviceType || row?.serviceType || "-"}
                          </Typography>
                        </td>
                        <td className="border-b border-blue-gray-50 py-3 px-5">
                          <Typography variant="small" className="font-semibold text-black">
                            {renderPerson(customer)}
                          </Typography>
                        </td>
                        <td className="border-b border-blue-gray-50 py-3 px-5">
                          <Typography variant="small" className="font-semibold text-black">
                            {renderPerson(driver)}
                          </Typography>
                        </td>
                        <td className="border-b border-blue-gray-50 py-3 px-5">
                          <Typography variant="small" className="font-semibold text-black">
                            {renderCabDetails(record) || booking?.cabNumber || booking?.vehicleNumber || "-"}
                          </Typography>
                        </td>
                        <td className="border-b border-blue-gray-50 py-3 px-5">
                          <Typography variant="small" className="font-semibold text-black">
                            {amount}
                          </Typography>
                        </td>
                        <td className="border-b border-blue-gray-50 py-3 px-5">
                          <Typography variant="small" className="font-semibold text-black">
                            {formatDateTime(createdAt)}
                          </Typography>
                        </td>
                        <td className="border-b border-blue-gray-50 py-3 px-5">
                          <Typography variant="small" className="font-semibold text-black">
                            {row?.action || row?.type || row?.status || "-"}
                          </Typography>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex flex-col items-center">            
            <div className="flex items-center justify-center">
              <Button
                size="sm"
                variant="text"
                disabled={pagination.currentPage === 1 || loading}
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                className="mx-1"
              >
                {"<"}
              </Button>
              {renderPageButtons()}
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
        </CardBody>
      </Card>
    </div>
  );
}

export default CustomerCancellationChargeLogs;