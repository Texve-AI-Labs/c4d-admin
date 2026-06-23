import React, { useEffect, useState } from "react";
import {
  Card,
  CardHeader,
  CardBody,
  Typography,
  Button,
  Spinner,
} from "@material-tailwind/react";
import { FunnelIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { API_ROUTES, ColorStyles } from "@/utils/constants";
import moment from "moment";

function DriverCancellationHistoryList() {
  const [records, setRecords] = useState([]);
  const [driverIdSearch, setDriverIdSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [minCancellationCount, setMinCancellationCount] = useState("");
  const [maxCancellationCount, setMaxCancellationCount] = useState("");
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [expandedRows, setExpandedRows] = useState({});
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
  });

  const toIstStartBoundary = (dateValue) =>
    `${dateValue}T00:00:00.000+05:30`;

  const toIstEndBoundary = (dateValue) =>
    `${dateValue}T23:59:59.999+05:30`;

  const getCancellationLogs = async (override = null, pageOverride = null) => {
    setLoading(true);
    try {
      const currentFilters = override ?? {
        driverIdSearch,
        startDate,
        endDate,
        minCancellationCount,
        maxCancellationCount,
      };
      const queryParams = {};
      if (currentFilters.driverIdSearch.trim()) {
        queryParams.driverId = currentFilters.driverIdSearch.trim();
      }
      if (currentFilters.startDate) {
        queryParams.startDate = toIstStartBoundary(currentFilters.startDate);
      }
      if (currentFilters.endDate) {
        queryParams.endDate = toIstEndBoundary(currentFilters.endDate);
      }
      if (currentFilters.minCancellationCount !== "") {
        queryParams.minCancellationCount = Number(currentFilters.minCancellationCount);
      }
      if (currentFilters.maxCancellationCount !== "") {
        queryParams.maxCancellationCount = Number(currentFilters.maxCancellationCount);
      }
      const requestPage = pageOverride ?? pagination.currentPage;
      queryParams.page = requestPage;
      queryParams.limit = pagination.itemsPerPage;

      const response = await ApiRequestUtils.getWithQueryParam(
        API_ROUTES.GET_DRIVER_CANCELLATION_LOGS,
        queryParams
      );

      if (response?.success) {
        const rows = response?.data?.rows;
        const apiPagination = response?.data?.meta?.pagination;
        setRecords(Array.isArray(rows) ? rows : []);
        setPagination((prev) => ({
          ...prev,
          currentPage: apiPagination?.page || requestPage,
          totalItems: apiPagination?.total || 0,
          itemsPerPage: apiPagination?.perPage || prev.itemsPerPage,
          totalPages: Math.max(
            1,
            Math.ceil((apiPagination?.total || 0) / (apiPagination?.perPage || prev.itemsPerPage))
          ),
        }));
      } else {
        setRecords([]);
        setPagination((prev) => ({
          ...prev,
          currentPage: requestPage,
          totalPages: 1,
          totalItems: 0,
        }));
      }
    } catch (error) {
      console.error("Failed to fetch driver cancellation logs:", error);
      setRecords([]);
      setPagination((prev) => ({
        ...prev,
        totalPages: 1,
        totalItems: 0,
      }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getCancellationLogs(null, 1);
  }, []);

  const handleClearFilters = () => {
    setDriverIdSearch("");
    setStartDate("");
    setEndDate("");
    setMinCancellationCount("");
    setMaxCancellationCount("");
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
    getCancellationLogs({
      driverIdSearch: "",
      startDate: "",
      endDate: "",
      minCancellationCount: "",
      maxCancellationCount: "",
    }, 1);
    setShowFilters(false);
  };

  const handleApplyFilters = () => {
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
    getCancellationLogs(null, 1);
    setShowFilters(false);
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= pagination.totalPages) {
      setPagination((prev) => ({ ...prev, currentPage: page }));
      getCancellationLogs(null, page);
    }
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

  const toggleRowExpand = (rowKey) => {
    setExpandedRows((prev) => ({
      ...prev,
      [rowKey]: !prev[rowKey],
    }));
  };

  return (
    <div className="mt-4 flex flex-col gap-12">
      <div className="flex items-center justify-end gap-2">
        <Button
          className="bg-red-900 text-white"
          onClick={handleClearFilters}
          disabled={loading}
        >
          Clear
        </Button>
        <Button
          className="flex items-center gap-2 bg-blue-600 text-white"
          onClick={() => setShowFilters(true)}
        >
          <FunnelIcon className="h-4 w-4" />
          Filter
        </Button>
      </div>

      {showFilters ? (
        <div className="fixed inset-0 z-50 flex items-start justify-end bg-black/20 p-4 pt-20">
          <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-4 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <Typography className="text-lg font-semibold text-gray-900">
                Filters
              </Typography>
              <button
                type="button"
                className="rounded-md p-1 text-gray-500 hover:bg-gray-100"
                onClick={() => setShowFilters(false)}
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="flex flex-col gap-2">
              <div>
                <label
                  htmlFor="driver-id-search"
                  className="block text-xs font-medium text-gray-700 mb-1"
                >
                  Driver ID
                </label>
                <input
              id="driver-id-search"
              type="text"
              value={driverIdSearch}
              onChange={(event) => setDriverIdSearch(event.target.value)}
              placeholder="Enter Driver ID"
                  className="w-full px-2.5 py-1.5 text-sm rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(event) => setStartDate(event.target.value)}
                    className="w-full px-2.5 py-1.5 text-sm rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(event) => setEndDate(event.target.value)}
                    className="w-full px-2.5 py-1.5 text-sm rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Min Cancellation Count
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={minCancellationCount}
                    onChange={(event) => setMinCancellationCount(event.target.value)}
                    className="w-full px-2.5 py-1.5 text-sm rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Max Cancellation Count
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={maxCancellationCount}
                    onChange={(event) => setMaxCancellationCount(event.target.value)}
                    className="w-full px-2.5 py-1.5 text-sm rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-200"
                  />
                </div>
              </div>
        </div>

            <div className="mt-3 flex flex-wrap justify-end gap-2">
              <Button className="bg-primary text-white" onClick={handleApplyFilters} disabled={loading}>
                Apply Filters
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <Card>
        <CardHeader
          variant="gradient"
          className={`mb-8 p-6 rounded-xl ${ColorStyles.bgColor}`}
        >
          <Typography variant="h6" color="white">
            Driver Cancellation History
          </Typography>
        </CardHeader>
        <CardBody className="overflow-x-scroll px-0 pt-0 pb-2">
          <table className="w-full min-w-[1300px] table-auto">
            <thead>
              <tr>
                {[
                  "Driver ID",
                  "Driver Name",
                  "Driver Phone Number",
                  "IST Date",
                  "Cancellation Count",
                  "Free Count",
                  "Penalty Count",
                  "Fee Deducted Total",
                  "History",
                ].map((el) => (
                  <th
                    key={el}
                    className="border-b border-blue-gray-50 py-3 px-5 text-left"
                  >
                    <Typography
                      variant="small"
                      className="text-[11px] font-bold uppercase text-black"
                    >
                      {el}
                    </Typography>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-8 px-5">
                    <div className="flex justify-center items-center">
                      <Spinner className="h-10 w-10" />
                    </div>
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 px-5 text-center">
                    <Typography className="text-sm font-medium text-blue-gray-500">
                      No Driver Cancellation History
                    </Typography>
                  </td>
                </tr>
              ) : (
                records.map((record, index) => {
                  const rowKey = `${record?.driverId}-${record?.istDate}-${index}`;
                  const rowClass = `py-3 px-5 ${
                    index === records.length - 1
                      ? ""
                      : "border-b border-blue-gray-50"
                  }`;
                  const driverName = record?.driverName ?? "-";
                  const driverId = record?.driverId ?? "-";
                  const istDate = record?.istDate ?? "-";
                  const cancellationCount = record?.cancellationCount ?? 0;
                  const freeCount = record?.freeCount ?? 0;
                  const penaltyCount = record?.penaltyCount ?? 0;
                  const driverPhoneNumber = record?.driverPhoneNumber ?? "-";
                  const feeDeductedTotal = record?.feeDeductedTotal ?? 0;
                  const history = Array.isArray(record?.history) ? record.history : [];

                  return (
                    <>
                      <tr key={rowKey}>
                        <td className={rowClass}>
                          <Typography className="text-xs font-semibold text-blue-gray-900">
                            {driverId}
                          </Typography>
                        </td>
                        <td className={rowClass}>
                          <Typography className="text-xs font-semibold text-blue-gray-900">
                            {driverName}
                          </Typography>
                        </td>
                        <td className={rowClass}>
                          <Typography className="text-xs font-semibold text-blue-gray-900">
                            {driverPhoneNumber}
                          </Typography>
                        </td>
                        <td className={rowClass}>
                          <Typography className="text-xs font-semibold text-blue-gray-900">
                            {istDate}
                          </Typography>
                        </td>
                        <td className={rowClass}>
                          <Typography className="text-xs font-semibold text-blue-gray-900">
                            {cancellationCount}
                          </Typography>
                        </td>
                        <td className={rowClass}>
                          <Typography className="text-xs font-semibold text-blue-gray-900">
                            {freeCount}
                          </Typography>
                        </td>
                        <td className={rowClass}>
                          <Typography className="text-xs font-semibold text-blue-gray-900">
                            {penaltyCount}
                          </Typography>
                        </td>
                        <td className={rowClass}>
                          <Typography className="text-xs font-semibold text-blue-gray-900">
                            ₹{Number(feeDeductedTotal || 0)}
                          </Typography>
                        </td>
                        <td className={rowClass}>
                          <button
                            type="button"
                            onClick={() => toggleRowExpand(rowKey)}
                            className="px-3 py-1 text-xs font-semibold text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50"
                          >
                            {expandedRows[rowKey] ? "Hide History" : "Show History"}
                          </button>
                        </td>
                      </tr>
                      {expandedRows[rowKey] ? (
                        <tr>
                          <td colSpan={9} className="bg-blue-gray-50 border-b border-blue-gray-50 px-5 py-3">
                            {history.length > 0 ? (
                              <table className="w-full text-xs">
                                <thead>
                                  <tr>
                                    {[
                                      "Booking ID",
                                      "Cancelled At",
                                      "Service Type",
                                      "Cancellation Order",
                                      "Fee Amount",
                                      "Fee Deducted",
                                    ].map((el) => (
                                      <th
                                        key={el}
                                        className="border-b border-blue-gray-100 py-2 px-3 text-left"
                                      >
                                        <Typography
                                          variant="small"
                                          className="text-[10px] font-bold uppercase text-black"
                                        >
                                          {el}
                                        </Typography>
                                      </th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {history.map((item, historyIndex) => (
                                    <tr key={`${rowKey}-history-${historyIndex}`} className="hover:bg-blue-gray-100">
                                      <td className="border-b border-blue-gray-50 py-2 px-3 text-black">
                                        {item?.bookingId ?? "-"}
                                      </td>
                                      <td className="border-b border-blue-gray-50 py-2 px-3 text-black">
                                        {item?.createdAt
                                          ? moment(item.createdAt).format("DD-MM-YYYY / hh:mm A")
                                          : "-"}
                                      </td>
                                      <td className="border-b border-blue-gray-50 py-2 px-3 text-black">
                                        {item?.serviceType ?? "-"}
                                      </td>
                                      <td className="border-b border-blue-gray-50 py-2 px-3 text-black">
                                        {item?.cancellationIndex ?? "-"}
                                      </td>
                                      <td className="border-b border-blue-gray-50 py-2 px-3 text-black">
                                        ₹{Number(item?.feeAmount || 0)}
                                      </td>
                                      <td className="border-b border-blue-gray-50 py-2 px-3 text-black">
                                        {item?.feeDeducted ? "Yes" : "No"}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            ) : (
                              <Typography className="text-xs font-medium text-blue-gray-500">
                                No history available
                              </Typography>
                            )}
                          </td>
                        </tr>
                      ) : null}
                    </>
                  );
                })
              )}
            </tbody>
          </table>
          <div className="flex items-center justify-center mt-4">
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
        </CardBody>
      </Card>
    </div>
  );
}

export default DriverCancellationHistoryList;
