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
const SERVICE_TYPE_OPTIONS = ["","BIKE","RIDES", "AUTO", "PARCEL", "DRIVER", "RENTAL"];

const normalizeRows = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.rows)) return payload.rows;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.logs)) return payload.logs;
  return [];
};

const getBookingRelation = (row) => row?.Booking || row?.booking || row?.bookingDetails || row?.bookingRelation || {};
const getRecord = (row) => getBookingRelation(row) || row || {};

const getPaymentDetails = (row) => row?.paymentDetails?.details || row?.paymentDetails || row?.Booking?.paymentDetails?.details || row?.Booking?.paymentDetails || row?.booking?.paymentDetails?.details || row?.booking?.paymentDetails || {};

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

const getPersonName = (person) => person?.fullName || [person?.salutation, person?.firstName, person?.lastName].filter(Boolean).join(" ") || person?.name || person?.customerName || person?.driverName ||
  "-";

const getPhoneNumber = (person) => person?.phoneNumber || person?.phone || person?.mobileNumber || "-";

const getTripLocation = (booking, kind) => {
  const candidates =
    kind === "pickup" ? [ booking?.pickupFormatAddress, booking?.pickupGeocodeAddress, booking?.pickupAddress, booking?.pickupLocation, booking?.pickup, booking?.fromLocation, booking?.fromAddress]
      : [ booking?.dropFormatAddress, booking?.dropGeocodeAddress, booking?.dropAddress, booking?.dropLocation, booking?.drop, booking?.toLocation, booking?.toAddress];

  const value = candidates.find((item) => item);
  if (!value) return "-";
  if (typeof value === "string") return value;

  if (typeof value?.name === "string") return value.name;
  return (value?.address || value?.formattedAddress || value?.label ||
    ([value?.latitude, value?.longitude].every((item) => item === null || item === undefined)
      ? "-"
      : `${value?.latitude}, ${value?.longitude}`)
  );
};

const getVehicleLabel = (booking, driver) => {
  const sources = [ booking?.Cab, booking?.cab, booking?.Auto, booking?.auto, booking?.Bike, booking?.bike, booking?.Parcel, booking?.parcel, driver?.Cab, driver?.cab, driver?.Auto, driver?.auto, driver?.Bike, driver?.bike, driver?.Parcel, driver?.parcel].filter(Boolean);

  for (const source of sources) {
    const label = source?.vehicleNumber || source?.registrationNumber || source?.cabNumber || source?.autoNumber || source?.bikeNumber || source?.parcelNumber || source?.name || source?.type || source?.vehicleType;
    if (label) return label;
  }

  return "-";
};

const getServiceTypeChipClass = (value) => {
  const normalized = String(value || "").toUpperCase();
  if (normalized === "RIDES") return "bg-blue-100 text-blue-800";
  if (normalized === "AUTO") return "bg-amber-100 text-amber-800";
  if (normalized === "BIKE") return "bg-emerald-100 text-emerald-800";
  if (normalized === "PARCEL") return "bg-purple-100 text-purple-800";
  if (normalized === "DRIVER") return "bg-red-100 text-red-800";
  if (normalized === "RENTAL") return "bg-teal-100 text-teal-800";
  return "bg-gray-100 text-gray-800";
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
      return getPersonName(value);
    }
    return String(value);
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
                    "Customer Phone",
                    "Driver",
                    "Driver Phone",
                    "Vehicle",
                    "Pick Up",
                    "Drop",
                    "Amount After GST",
                    "Subscription Deduction",
                    "Cancel Charge",
                    "Payment Total",
                    "Created At",
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
                    const bookingRelation = getBookingRelation(row);
                    const record = getRecord(row);
                    const logId = row?.id || row?.logId || record?.id || record?.logId || `${pagination.currentPage}-${index}`;
                    const booking = bookingRelation?.Booking || bookingRelation?.booking || bookingRelation;
                    const customer = bookingRelation?.Customer || bookingRelation?.customer || booking?.Customer || booking?.customer || {};
                    const driver = bookingRelation?.Driver || bookingRelation?.driver || booking?.Driver || booking?.driver || {};
                    const paymentDetails = getPaymentDetails(row);
                    const amountAfterGst = paymentDetails?.amountAfterGst ?? paymentDetails?.amount_after_gst ?? row?.amountAfterGst ?? row?.amount_after_gst ?? "-";
                    const subscriptionDeductionAmount = paymentDetails?.subscriptionDeductionAmount ?? paymentDetails?.subscription_deduction_amount ?? "-";
                    const cancelChargeAmount = paymentDetails?.cancelChargeAmount ?? paymentDetails?.cancelCharge ?? paymentDetails?.cancel_charge_amount ?? "-";
                    const totalAfterCashback = paymentDetails?.totalAfterCashback ?? paymentDetails?.amountAfterDiscount ?? paymentDetails?.total_after_cashback ?? "-";
                    const createdAt = row?.created_at || row?.createdAt || record?.created_at || record?.createdAt;
                    const customerName = getPersonName(customer);
                    const driverName = getPersonName(driver);
                    const customerPhone = getPhoneNumber(customer);
                    const driverPhone = getPhoneNumber(driver);
                    const vehicleLabel = getVehicleLabel(booking, driver);

                    return (
                      <tr key={logId}>
                        <td className="whitespace-nowrap border-b border-blue-gray-50 py-3 px-5">
                          <Typography variant="small" className="font-semibold text-black">
                            {formatValue(logId)}
                          </Typography>
                        </td>
                        <td className="whitespace-nowrap border-b border-blue-gray-50 py-3 px-5">
                          <Typography variant="small" className="font-semibold text-black">
                            {booking?.bookingNumber || booking?.id || record?.bookingId || row?.bookingId || "-"}
                          </Typography>
                        </td>
                        <td className="whitespace-nowrap border-b border-blue-gray-50 py-3 px-5">
                          {(() => {
                            const serviceType = record?.serviceType || booking?.serviceType || row?.serviceType || "-";
                            return (
                              <span
                                className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${getServiceTypeChipClass(serviceType)}`}
                              >
                                {serviceType}
                              </span>
                            );
                          })()}
                        </td>
                        <td className="whitespace-nowrap border-b border-blue-gray-50 py-3 px-5">
                          <Typography variant="small" className="font-semibold text-black">
                            {customerName}
                          </Typography>
                        </td>
                        <td className="whitespace-nowrap border-b border-blue-gray-50 py-3 px-5">
                          <Typography variant="small" className="font-semibold text-black">
                            {customerPhone}
                          </Typography>
                        </td>
                        <td className="whitespace-nowrap border-b border-blue-gray-50 py-3 px-5">
                          <Typography variant="small" className="font-semibold text-black">
                            {driverName}
                          </Typography>
                        </td>
                        <td className="whitespace-nowrap border-b border-blue-gray-50 py-3 px-5">
                          <Typography variant="small" className="font-semibold text-black">
                            {driverPhone}
                          </Typography>
                        </td>
                        <td className="whitespace-nowrap border-b border-blue-gray-50 py-3 px-5">
                          <Typography variant="small" className="font-semibold text-black">
                            {vehicleLabel}
                          </Typography>
                        </td>
                        <td className="border-b border-blue-gray-50 py-3 px-5">
                          <Typography variant="small" className="font-semibold text-black">
                            {getTripLocation(booking, "pickup")}
                          </Typography>
                        </td>
                        <td className="border-b border-blue-gray-50 py-3 px-5">
                          <Typography variant="small" className="font-semibold text-black">
                            {getTripLocation(booking, "drop")}
                          </Typography>
                        </td>
                        <td className="whitespace-nowrap border-b border-blue-gray-50 py-3 px-5">
                          <Typography variant="small" className="font-semibold text-black">
                            {amountAfterGst}
                          </Typography>
                        </td>
                        <td className="whitespace-nowrap border-b border-blue-gray-50 py-3 px-5">
                          <Typography variant="small" className="font-semibold text-black">
                            {subscriptionDeductionAmount}
                          </Typography>
                        </td>
                        <td className="whitespace-nowrap border-b border-blue-gray-50 py-3 px-5">
                          <Typography variant="small" className="font-semibold text-black">
                            {cancelChargeAmount}
                          </Typography>
                        </td>
                        <td className="whitespace-nowrap border-b border-blue-gray-50 py-3 px-5">
                          <Typography variant="small" className="font-semibold text-black">
                            {totalAfterCashback}
                          </Typography>
                        </td>
                        <td className="whitespace-nowrap border-b border-blue-gray-50 py-3 px-5">
                          <Typography variant="small" className="font-semibold text-black">
                            {formatDateTime(createdAt)}
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