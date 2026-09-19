import React, { useEffect, useState } from "react";
import { Button, Card, CardBody, Input, Option, Select, Spinner, Typography } from "@material-tailwind/react";
import { useNavigate } from "react-router-dom";
import moment from "moment";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { API_ROUTES, ColorStyles } from "@/utils/constants";

const PAGE_LIMIT = 20;
const fuelFilterOptions = [
  { label: "All", value: "ALL" },
  { label: "CNG", value: "CNG" },
  { label: "Petrol", value: "PETROL" },
  { label: "Diesel", value: "DIESEL" },
];

const emptyFilters = {
  fromDate: "",
  toDate: "",
  vehicleNumber: "",
  fuelType: "ALL",
};

const normalizeRows = (payload) => {
  const body = payload?.data ?? payload?.result ?? payload;
  if (Array.isArray(body)) return body;
  if (Array.isArray(body?.rows)) return body.rows;
  if (Array.isArray(body?.items)) return body.items;
  if (Array.isArray(body?.list)) return body.list;
  if (Array.isArray(body?.data)) return body.data;
  return [];
};

const resolvePagination = (response, rows, fallbackPage, fallbackLimit) => {
  const body = response?.data ?? response?.result ?? {};
  const pagination = response?.pagination || response?.meta || body?.pagination || body?.meta || {};
  const limit = Number(pagination.itemsPerPage || pagination.limit || fallbackLimit || PAGE_LIMIT);
  const totalItems = Number(pagination.totalItems || pagination.total || pagination.count || body?.total || rows.length || 0);
  const totalPages = Number(pagination.totalPages || (limit > 0 ? Math.max(1, Math.ceil(totalItems / limit)) : 1));
  const currentPage = Number(pagination.currentPage || pagination.page || fallbackPage || 1);
  return { currentPage, totalPages, totalItems, itemsPerPage: limit };
};

const formatDateTime = (value) => {
  if (!value) return "-";
  const parsed = moment(value);
  return parsed.isValid() ? parsed.format("DD-MM-YYYY hh:mm A") : String(value);
};

const formatValue = (value) => (value === undefined || value === null || value === "" ? "-" : value);
const formatAmount = (value) => (value === undefined || value === null || value === "" ? "-" : `₹ ${Number(value).toLocaleString("en-IN")}`);

function OwnVehicle() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState(emptyFilters);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: PAGE_LIMIT,
  });

  const buildQuery = (page = pagination.currentPage, activeFilters = filters) => {
    const query = { page, limit: pagination.itemsPerPage };
    Object.entries(activeFilters).forEach(([key, value]) => {
      const nextValue = String(value || "").trim();
      if (nextValue && nextValue !== "ALL") query[key] = nextValue;
    });
    return query;
  };

  const fetchRows = async (page = pagination.currentPage, activeFilters = filters) => {
    setLoading(true);
    setError("");
    try {
      const response = await ApiRequestUtils.getWithQueryParam(API_ROUTES.OWN_VEHICLE_TRIPS, buildQuery(page, activeFilters));
      if (response?.success === false) {
        setRows([]);
        setError(response?.message || "Failed to load own vehicle trips.");
        return;
      }
      const nextRows = normalizeRows(response);
      setRows(nextRows);
      setPagination((prev) => ({
        ...prev,
        ...resolvePagination(response, nextRows, page, prev.itemsPerPage),
      }));
    } catch (err) {
      console.error("Error fetching own vehicle trips:", err);
      setRows([]);
      setError("Failed to load own vehicle trips.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRows(pagination.currentPage, filters);
  }, [pagination.currentPage, pagination.itemsPerPage]);

  const applyFilters = () => {
    if (filters.fromDate && filters.toDate && moment(filters.fromDate).isAfter(moment(filters.toDate))) {
      setError("From Date cannot be later than To Date.");
      return;
    }

    setError("");
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
    fetchRows(1, filters);
  };

  const clearFilters = () => {
    setFilters(emptyFilters);
    setError("");
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
    fetchRows(1, emptyFilters);
  };

  const handlePageChange = (page) => {
    if (page < 1 || page > pagination.totalPages || loading) return;
    setPagination((prev) => ({ ...prev, currentPage: page }));
  };

  const pageButtons = () => {
    const buttons = [];
    const maxVisible = 5;
    let startPage = Math.max(1, pagination.currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(pagination.totalPages, startPage + maxVisible - 1);
    if (endPage - startPage < maxVisible - 1) startPage = Math.max(1, endPage - maxVisible + 1);
    for (let page = startPage; page <= endPage; page += 1) {
      buttons.push(
        <Button
          key={page}
          size="sm"
          variant={page === pagination.currentPage ? "filled" : "outlined"}
          className={`mx-1 ${page === pagination.currentPage ? `${ColorStyles.bgColor} text-white` : "border-blue-500 text-blue-500"}`}
          onClick={() => handlePageChange(page)}
        >
          {page}
        </Button>
      );
    }
    return buttons;
  };

  const goToMode = (mode, row) => {
    const suffix = mode === "add" ? "add" : `${mode}/${row?.id}`;
    navigate(`/dashboard/support/own-vehicle/${suffix}`, { state: { row } });
  };

  return (
    <div className="mb-8 mt-8 flex flex-col gap-6">
      <Card>
        <CardBody className="flex flex-col gap-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <Typography variant="h6" color="black">
              Own Vehicle
            </Typography>
            <Button className={`${ColorStyles.bgColor} text-white`} onClick={() => goToMode("add")}>
              Add New
            </Button>
          </div>

          {error && <div className="rounded-md bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] md:items-start">
            <Input type="date" label="From Date" value={filters.fromDate} onChange={(e) => setFilters((prev) => ({ ...prev, fromDate: e.target.value }))} />
            <Input type="date" label="To Date" value={filters.toDate} onChange={(e) => setFilters((prev) => ({ ...prev, toDate: e.target.value }))} />
            <Button className={`${ColorStyles.bgColor} min-w-[120px] text-white`} onClick={applyFilters}>Filter</Button>
            <Input label="Vehicle Number" value={filters.vehicleNumber} onChange={(e) => setFilters((prev) => ({ ...prev, vehicleNumber: e.target.value }))} />
            <Select label="Fuel Type" value={filters.fuelType} onChange={(value) => setFilters((prev) => ({ ...prev, fuelType: value }))}>
              {fuelFilterOptions.map((option) => (
                <Option key={option.value} value={option.value}>{option.label}</Option>
              ))}
            </Select>
            <Button variant="outlined" className="min-w-[120px]" onClick={clearFilters}>Clear</Button>
          </div>

          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[1500px] table-auto">
              <thead>
                <tr className={ColorStyles.bgColor}>
                  {["Trip Start Date Time", "Trip End Date Time", "Vehicle Number", "Driver Name", "Start KM", "End KM", "Total KM", "Total Trip Amount", "Fuel Type", "Fuel Amount", "Other Expense", "Closing Amount", "Notes", "Created At", "Updated At", "Actions"].map((header) => (
                    <th key={header} className="border-b border-blue-gray-50 px-3 py-3 text-left whitespace-nowrap">
                      <Typography variant="small" className="text-[11px] font-bold uppercase text-white">
                        {header}
                      </Typography>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={16} className="py-6 text-center"><Spinner className="mx-auto h-6 w-6" /></td></tr>
                ) : rows.length === 0 ? (
                  <tr><td colSpan={16} className="py-6 text-center text-sm text-blue-gray-500">No own vehicle trips found.</td></tr>
                ) : (
                  rows.map((row, index) => (
                    <tr key={row?.id || index} className="border-b border-blue-gray-50 text-sm">
                      <td className="px-3 py-3 whitespace-nowrap">{formatDateTime(row?.tripStartDate)}</td>
                      <td className="px-3 py-3 whitespace-nowrap">{formatDateTime(row?.tripEndDateTime)}</td>
                      <td className="px-3 py-3 whitespace-nowrap">{formatValue(row?.vehicleNumber)}</td>
                      <td className="px-3 py-3 whitespace-nowrap">{formatValue(row?.driverName)}</td>
                      <td className="px-3 py-3 whitespace-nowrap">{formatValue(row?.startKm)}</td>
                      <td className="px-3 py-3 whitespace-nowrap">{formatValue(row?.endKm)}</td>
                      <td className="px-3 py-3 whitespace-nowrap">{formatValue(row?.totalKm ?? Number(row?.endKm || 0) - Number(row?.startKm || 0))}</td>
                      <td className="px-3 py-3 whitespace-nowrap">{formatAmount(row?.totalTripAmount)}</td>
                      <td className="px-3 py-3 whitespace-nowrap">{formatValue(row?.fuelType)}</td>
                      <td className="px-3 py-3 whitespace-nowrap">{formatAmount(row?.fuelAmount)}</td>
                      <td className="px-3 py-3 whitespace-nowrap">{formatAmount(row?.otherExpense)}</td>
                      <td className="px-3 py-3 whitespace-nowrap">{formatAmount(row?.closingAmount ?? Number(row?.totalTripAmount || 0) - Number(row?.fuelAmount || 0) - Number(row?.otherExpense || 0))}</td>
                      <td className="px-3 py-3 max-w-[220px] truncate">{formatValue(row?.notes)}</td>
                      <td className="px-3 py-3 whitespace-nowrap">{formatDateTime(row?.createdAt || row?.created_at)}</td>
                      <td className="px-3 py-3 whitespace-nowrap">{formatDateTime(row?.updatedAt || row?.updated_at)}</td>
                      <td className="px-3 py-3 whitespace-nowrap min-w-[180px]">
                        <div className="flex flex-row items-center gap-2">
                          <Button size="sm" variant="outlined" onClick={() => goToMode("details", row)}>Details</Button>
                          <Button size="sm" className={`${ColorStyles.bgColor} text-white`} onClick={() => goToMode("edit", row)}>Edit</Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 lg:hidden">
            {loading ? (
              <div className="flex justify-center py-6"><Spinner className="h-6 w-6" /></div>
            ) : rows.length === 0 ? (
              <div className="py-6 text-center text-sm text-blue-gray-500">No own vehicle trips found.</div>
            ) : (
              rows.map((row, index) => (
                <div key={row?.id || index} className="rounded-lg border border-blue-gray-50 bg-white p-4 shadow-sm">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <Typography variant="small" className="font-semibold text-blue-gray-900 break-words">{formatValue(row?.vehicleNumber)}</Typography>
                      <Typography variant="small" className="text-blue-gray-600 break-words">{formatValue(row?.driverName)}</Typography>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outlined" onClick={() => goToMode("details", row)}>Details</Button>
                      <Button size="sm" className={`${ColorStyles.bgColor} text-white`} onClick={() => goToMode("edit", row)}>Edit</Button>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {[
                      ["Trip Start", formatDateTime(row?.tripStartDate)],
                      ["Trip End", formatDateTime(row?.tripEndDateTime)],
                      ["Start KM", formatValue(row?.startKm)],
                      ["End KM", formatValue(row?.endKm)],
                      ["Total KM", formatValue(row?.totalKm ?? Number(row?.endKm || 0) - Number(row?.startKm || 0))],
                      ["Trip Amount", formatAmount(row?.totalTripAmount)],
                      ["Fuel Type", formatValue(row?.fuelType)],
                      ["Fuel Amount", formatAmount(row?.fuelAmount)],
                      ["Other Expense", formatAmount(row?.otherExpense)],
                      ["Closing Amount", formatAmount(row?.closingAmount ?? Number(row?.totalTripAmount || 0) - Number(row?.fuelAmount || 0) - Number(row?.otherExpense || 0))],
                      ["Created At", formatDateTime(row?.createdAt || row?.created_at)],
                      ["Updated At", formatDateTime(row?.updatedAt || row?.updated_at)],
                    ].map(([label, value]) => (
                      <div key={label} className="min-w-0">
                        <div className="text-[11px] font-semibold uppercase text-blue-gray-400">{label}</div>
                        <div className="break-words text-sm text-blue-gray-800">{value}</div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 min-w-0">
                    <div className="text-[11px] font-semibold uppercase text-blue-gray-400">Notes</div>
                    <div className="break-words text-sm text-blue-gray-800">{formatValue(row?.notes)}</div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-1">
            <Button size="sm" variant="text" disabled={pagination.currentPage === 1 || loading} onClick={() => handlePageChange(pagination.currentPage - 1)}>
              {"<"}
            </Button>
            {pageButtons()}
            <Button size="sm" variant="text" disabled={pagination.currentPage === pagination.totalPages || loading} onClick={() => handlePageChange(pagination.currentPage + 1)}>
              {">"}
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

export default OwnVehicle;