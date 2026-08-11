import React, { useEffect, useMemo, useState } from "react";
import { Button, Card, CardBody, Input, Spinner } from "@material-tailwind/react";
import moment from "moment";
import Select from "react-select";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { API_ROUTES, ColorStyles } from "@/utils/constants";
import { useNavigate } from "react-router-dom";

const DEFAULT_PAGE_SIZE = 20;

const ACCOUNT_TYPE_OPTIONS = ["DRIVER", "CUSTOMER", "CAB", "AUTO", "BIKE", "PARCEL"];
const REFERRAL_TYPE_OPTIONS = ["DRIVER_TO_DRIVER", "DRIVER_TO_CUSTOMER", "CUSTOMER_TO_CUSTOMER"];
const ACCOUNT_TYPE_LABELS = {
  DRIVER: "Driver",
  CUSTOMER: "Customer",
  CAB: "Cab",
  AUTO: "Auto",
  BIKE: "Bike",
  PARCEL: "Parcel",
};
const REFERRAL_TYPE_LABELS = {
  DRIVER_TO_DRIVER: "Driver to Driver",
  DRIVER_TO_CUSTOMER: "Driver to Customer",
  CUSTOMER_TO_CUSTOMER: "Customer to Customer",
};
const REFERRAL_TYPE_BG = {
  DRIVER_TO_DRIVER: "bg-gray-400 text-white",
  DRIVER_TO_CUSTOMER: "bg-blue-400 text-white",
  CUSTOMER_TO_CUSTOMER: "bg-red-400 text-white",
};
const REFERRER_TYPE_BG = {
  DRIVER: "bg-gray-400 text-white",
  CUSTOMER: "bg-red-400 text-white",
};

const selectStyles = {
  control: (base, state) => ({
    ...base,
    minHeight: "38px",
    height: "38px",
    borderColor: state.isFocused ? "#1c64f2" : "#d1d5db",
    boxShadow: state.isFocused ? "0 0 0 1px #1c64f2" : "none",
    borderRadius: "0.75rem",
    "&:hover": {
      borderColor: "#1c64f2",
    },
  }),
  valueContainer: (base) => ({
    ...base,
    height: "38px",
    paddingTop: 0,
    paddingBottom: 0,
  }),
  indicatorsContainer: (base) => ({
    ...base,
    height: "38px",
  }),
  input: (base) => ({
    ...base,
    margin: 0,
    padding: 0,
  }),
  menu: (base) => ({
    ...base,
    zIndex: 30,
  }),
  placeholder: (base) => ({
    ...base,
    color: "#94a3b8",
  }),
  singleValue: (base) => ({
    ...base,
    color: "#334155",
  }),
};

const buildSelectValue = (value, labelMap, allLabel) => ({
  value,
  label: value === "ALL" ? allLabel : labelMap[value] || value,
});

const getReferralTypeLabel = (value) => {
  if (!value || value === "-") return "-";
  const normalizedValue = String(value).toUpperCase();
  return REFERRAL_TYPE_LABELS[normalizedValue] || value;
};

const ACCOUNT_TYPE_SELECT_OPTIONS = [
  { value: "ALL", label: "All Account Types" },
  ...ACCOUNT_TYPE_OPTIONS.map((option) => ({ value: option, label: ACCOUNT_TYPE_LABELS[option] || option })),
];

const REFERRAL_TYPE_SELECT_OPTIONS = [
  { value: "ALL", label: "All Referral Types" },
  ...REFERRAL_TYPE_OPTIONS.map((option) => ({ value: option, label: REFERRAL_TYPE_LABELS[option] || option })),
];

const normalizeRows = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.rows)) return payload.rows;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.logs)) return payload.logs;
  return [];
};

const resolvePagination = (response, rows, fallbackPage, fallbackLimit) => {
  const body = response?.data || {};
  const meta = response?.meta || body?.meta || {};
  const pagination = response?.pagination || body?.pagination || {};
  const totalItems = Number(
    pagination.totalItems ||
      pagination.total ||
      pagination.count ||
      meta.count ||
      body.total ||
      body.count ||
      rows.length ||
      0
  );
  const limit = Number(
    pagination.itemsPerPage ||
      pagination.limit ||
      meta.limit ||
      body.limit ||
      fallbackLimit ||
      DEFAULT_PAGE_SIZE
  );
  const totalPages = Number(
    pagination.totalPages ||
      meta.totalPages ||
      body.totalPages ||
      (totalItems > 0 ? Math.max(1, Math.ceil(totalItems / Math.max(limit, 1))) : 1)
  );
  const currentPage = Number(pagination.currentPage || meta.page || body.page || fallbackPage || 1);
  return { currentPage, totalPages, totalItems, itemsPerPage: limit };
};

const toQuery = (filters, page, limit) => {
  const query = {
    page,
    limit,
    transactionType: "REFERRAL",
  };
  if (filters.fromDate) query.fromDate = filters.fromDate;
  if (filters.toDate) query.toDate = filters.toDate;
  if (filters.accountType && filters.accountType !== "ALL") query.accountType = filters.accountType;
  if (filters.referralType && filters.referralType !== "ALL") query.referralType = filters.referralType;
  return query;
};

const formatValue = (value) => {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "object") return value?.name || value?.fullName || value?.id || "-";
  return String(value);
};

const ReferralCreditLogsList = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    fromDate: "",
    toDate: "",
    accountType: "ALL",
    referralType: "ALL",
  });
  const [appliedFilters, setAppliedFilters] = useState(filters);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: DEFAULT_PAGE_SIZE,
  });

  const fetchLogs = async (page = 1, nextFilters = appliedFilters) => {
    try {
      setLoading(true);
      const query = toQuery(nextFilters, page, pagination.itemsPerPage || DEFAULT_PAGE_SIZE);
      const response = await ApiRequestUtils.getWithQueryParam(API_ROUTES.GET_REFERRAL_CREDIT_LOGS, query);
      const list = normalizeRows(response?.data ?? response);
      setRows(list);
      setPagination(resolvePagination(response, list, page, pagination.itemsPerPage || DEFAULT_PAGE_SIZE));
    } catch (error) {
      console.error("Failed to fetch referral credit logs:", error);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(1, appliedFilters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliedFilters]);

  const pageButtons = useMemo(() => {
    const buttons = [];
    const maxVisible = 5;
    const totalPages = Math.max(1, Number(pagination.totalPages) || 1);
    const currentPage = Math.min(Math.max(1, Number(pagination.currentPage) || 1), totalPages);
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }
    for (let page = startPage; page <= endPage; page += 1) {
      buttons.push(
        <Button
          key={page}
          size="sm"
          variant={page === currentPage ? "filled" : "outlined"}
          className={`mx-1 ${page === currentPage ? "bg-primary text-white" : "text-primary"}`}
          onClick={() => handlePageChange(page)}
          disabled={loading}
        >
          {page}
        </Button>
      );
    }
    return buttons;
  }, [pagination.currentPage, pagination.totalPages, loading]);

  const handleApplyFilters = () => {
    setAppliedFilters(filters);
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
    fetchLogs(1, filters);
  };

  const handleReset = () => {
    const reset = { fromDate: "", toDate: "", accountType: "ALL", referralType: "ALL" };
    setFilters(reset);
    setAppliedFilters(reset);
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
    fetchLogs(1, reset);
  };

  const handlePageChange = (page) => {
    const totalPages = Math.max(1, Number(pagination.totalPages) || 1);
    if (page < 1 || page > totalPages || loading) return;
    setPagination((prev) => ({ ...prev, currentPage: page }));
    fetchLogs(page, appliedFilters);
  };

  const normalizedRows = useMemo(
    () =>
      rows.map((row, index) => ({
        id: row?.id || row?.logId || `${pagination.currentPage}-${index}`,
        walletTransactionId: row?.walletTransactionId,
        createdAt: row?.createdAt || row?.created_at,
        transactionDate: row?.transactionDate,
        description: row?.description || "-",
        referralType: row?.referralType || "-",
        amount: row?.amount || row?.creditAmount || row?.referralAmount || "-",
        balance: row?.balance || "-",
        referrerAmount: row?.referrerAmount ?? row?.amount ?? "-",
        referredAmount: row?.referredAmount ?? "-",
        referrer: row?.referrer || {},
        booking: row?.booking || {},
        raw: row,
      })),
    [rows, pagination.currentPage]
  );

  return (
    <div className="mb-4 flex flex-col gap-6 mt-2 bg-white pb-2 rounded-xl">
      <div className="flex w-full overflow-hidden rounded-xl bg-slate-100 p-1 mb-2 mt-2 gap-2">
        <Button
          size="sm"
          variant="outlined"
          className="w-1/2 rounded-lg px-4 py-2"
          onClick={() => navigate("/dashboard/finance/referral-rules/list")}
        >
          Rules
        </Button>
        <Button
          size="sm"
          variant="filled"
          className={`w-1/2 rounded-lg px-4 py-2 ${ColorStyles.continueButtonColor}`}
          onClick={() => navigate("/dashboard/finance/referral-rules/logs")}
        >
          Log
        </Button>
      </div>

      <Card>
        <CardBody className="pt-4 px-4">
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="flex flex-col gap-4 xl:flex-row xl:flex-nowrap xl:items-end xl:gap-5">
              <div className="w-full xl:w-[190px]">
                <Input
                  type="date"
                  label="From Date"
                  value={filters.fromDate}
                  onChange={(e) => setFilters((prev) => ({ ...prev, fromDate: e.target.value }))}
                />
              </div>
              <div className="w-full xl:w-[190px]">
                <Input
                  type="date"
                  label="To Date"
                  value={filters.toDate}
                  onChange={(e) => setFilters((prev) => ({ ...prev, toDate: e.target.value }))}
                />
              </div>
              <div className="w-full xl:w-[230px]">
                <Select
                  classNamePrefix="react-select"
                  styles={selectStyles}
                  options={ACCOUNT_TYPE_SELECT_OPTIONS}
                  value={buildSelectValue(filters.accountType, ACCOUNT_TYPE_LABELS, "All Account Types")}
                  onChange={(selectedOption) =>
                    setFilters((prev) => ({ ...prev, accountType: selectedOption?.value || "ALL" }))
                  }
                  isSearchable={false}
                />
              </div>
              <div className="w-full xl:w-[240px]">
                <Select
                  classNamePrefix="react-select"
                  styles={selectStyles}
                  options={REFERRAL_TYPE_SELECT_OPTIONS}
                  value={buildSelectValue(filters.referralType, REFERRAL_TYPE_LABELS, "All Referral Types")}
                  onChange={(selectedOption) =>
                    setFilters((prev) => ({ ...prev, referralType: selectedOption?.value || "ALL" }))
                  }
                  isSearchable={false}
                />
              </div>
              <div className="flex items-center gap-3 xl:ml-auto xl:shrink-0">
                <Button className={`rounded-xl ${ColorStyles.continueButtonColor} whitespace-nowrap`} onClick={handleApplyFilters}>
                  Apply
                </Button>
                <Button variant="outlined" className="rounded-xl whitespace-nowrap" onClick={handleReset}>
                  Reset
                </Button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-10">
              <Spinner className="h-12 w-12" />
            </div>
          ) : (
            <div className="overflow-x-auto mt-2">
              <table className="w-full min-w-[1100px] table-auto text-sm">
                <thead>
                  <tr>
                                        {/* <th className="py-3 px-5 text-left whitespace-nowrap bg-primary text-white">Referral Type</th> */}
                                        <th className="py-3 px-5 text-left whitespace-nowrap bg-primary text-white">wallet Id</th>
                    <th className="py-3 px-5 text-left whitespace-nowrap bg-primary text-white">Booking Number</th>
                    <th className="py-3 px-5 text-left whitespace-nowrap bg-primary text-white">Customer Name</th>
                    <th className="py-3 px-5 text-left whitespace-nowrap bg-primary text-white">Customer Phone</th>
                    <th className="py-3 px-5 text-left whitespace-nowrap bg-primary text-white">Amount</th>
                    <th className="py-3 px-5 text-left whitespace-nowrap bg-primary text-white">Referrer Name</th>
                    <th className="py-3 px-5 text-left whitespace-nowrap bg-primary text-white">Phone Number</th>
                    <th className="py-3 px-5 text-left whitespace-nowrap bg-primary text-white">Referrer Type</th>
                    <th className="py-3 px-5 text-left whitespace-nowrap bg-primary text-white">Transaction Date</th>
                    {/* <th className="py-3 px-5 text-left whitespace-nowrap bg-primary text-white">Created At</th> */}
                    <th className="py-3 px-5 text-left whitespace-nowrap bg-primary text-white">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {normalizedRows.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="py-4 px-5 text-center text-gray-600 whitespace-nowrap">
                        No records found
                      </td>
                    </tr>
                  ) : (
                    normalizedRows.map((row) => (
                      <tr key={row.id} className="border-b">
                        {/* <td className="py-2 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                              REFERRAL_TYPE_BG[String(row.referralType || "").toUpperCase()] || "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {getReferralTypeLabel(row.referralType)}
                          </span>
                        </td> */}
                        <td className="py-2 px-4 whitespace-nowrap">{formatValue(row.walletTransactionId)}</td>
                        <td className="py-2 px-4 whitespace-nowrap">{formatValue(row.booking?.bookingNumber)}</td>
                        <td className="py-2 px-4 whitespace-nowrap">{formatValue(row.booking?.customer?.firstName)}</td>
                        <td className="py-2 px-4 whitespace-nowrap">{formatValue(row.booking?.customer?.phoneNumber)}</td>
                        <td className="py-2 px-4 whitespace-nowrap font-bold">₹ {formatValue(row.amount)}</td>                       
                        <td className="py-2 px-4 whitespace-nowrap">
                          {formatValue(row.referrer?.firstName)}
                        </td>
                        <td className="py-2 px-4 whitespace-nowrap">
                          {formatValue(row.referrer?.phoneNumber)}
                        </td>
                        <td className="py-2 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                              REFERRER_TYPE_BG[String(row.referrer?.type || "").toUpperCase()] || "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {formatValue(row.referrer?.type)}
                          </span>
                        </td>                        
                          <td className="py-2 px-4 whitespace-nowrap">
                          {row.transactionDate ? moment(row.transactionDate).format("DD-MM-YYYY / hh:mm A") : "-"}
                        </td>
                        {/* <td className="py-2 px-4 whitespace-nowrap">
                          {row.createdAt ? moment(row.createdAt).format("DD-MM-YYYY / hh:mm A") : "-"}
                        </td> */}
                        <td className="py-2 px-4 whitespace-nowrap">{formatValue(row.description)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      <div className="flex items-center justify-center mt-2 gap-2">
        <Button size="sm" variant="text" disabled={pagination.currentPage === 1 || loading} onClick={() => handlePageChange(pagination.currentPage - 1)} className="mx-1">
          {"<"}
        </Button>
        {pageButtons}
        <Button size="sm" variant="text" disabled={pagination.currentPage === pagination.totalPages || loading} onClick={() => handlePageChange(pagination.currentPage + 1)} className="mx-1">
          {">"}
        </Button>
      </div>
    </div>
  );
};

export default ReferralCreditLogsList;
