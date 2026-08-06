import React, { useEffect, useState } from "react";
import { Card, CardBody, Typography, Button } from "@material-tailwind/react";
import { API_ROUTES, ColorStyles } from "@/utils/constants";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import moment from "moment";

const PAGE_LIMIT = 20;
const formatValueWithReadableLabel = (value) => (value ? String(value) : "-");
const formatDateTime = (value) => (value ? moment(value).format("DD-MM-YYYY hh:mm A") : "-");
const statusBadgeClass = (value) =>
  value
    ? "inline-flex items-center rounded-full bg-red-600 px-3 py-1 text-white font-semibold"
    : "text-gray-600";

const firstNonEmpty = (...values) =>
  values.find((val) => val !== undefined && val !== null && String(val).trim() !== "");

const resolveDriverDetails = (row) => {
  const driver = row?.Driver || row?.driver;
  const account =
    row?.Account ||
    row?.account ||
    row?.Cab?.Account ||
    row?.cab?.Account ||
    row?.Auto?.Account ||
    row?.auto?.Account;
  const cab = row?.Cab || row?.cab;
  const auto = row?.Auto || row?.auto;

  const driverFullName = [driver?.firstName, driver?.lastName].filter(Boolean).join(" ").trim();
  const name =
    firstNonEmpty(
      driverFullName,
      row?.driverName,
      account?.name,
      cab?.name,
      auto?.name,
      row?.driverId ? `Driver #${row.driverId}` : ""
    ) || "-";

  const phone =
    firstNonEmpty(
      driver?.phoneNumber,
      account?.phoneNumber,
      cab?.phoneNumber,
      auto?.phoneNumber,
      row?.driverPhone,
      row?.phoneNumber
    ) || "-";

  const driverId = firstNonEmpty(
    row?.driverId,
    driver?.id,
    account?.id,
    account?.driverId,
    row?.DriverId
  ) || "-";

  return { name, phone, driverId };
};

const resolveCustomerDetails = (row) => {
  const customer = row?.Customer || row?.customer;
  const name = firstNonEmpty(
    [customer?.firstName, customer?.lastName].filter(Boolean).join(" ").trim(),
    customer?.name,
    row?.customerName,
    row?.customer?.firstName,
    row?.customer?.name
  ) || "-";
  const phone = firstNonEmpty(customer?.phoneNumber, row?.customerPhone, row?.customer?.phoneNumber) || "-";
  const customerId = firstNonEmpty(customer?.id, row?.customerId) || "-";

  return { name, phone, customerId };
};

const resolveSubscriptionEntityDetails = (row) => {
  const driver = row?.Driver || row?.driver;
  const auto = row?.Auto || row?.auto;
  const bike = row?.Bike || row?.bike;
  const parcel = row?.Parcel || row?.parcel;

  if (driver) {
    return {
      label: "Driver",
      idLabel: "Driver ID",
      id: firstNonEmpty(row?.driverId, driver?.id, row?.DriverId, row?.accountId) || "-",
      name: firstNonEmpty(
        [driver?.firstName, driver?.lastName].filter(Boolean).join(" ").trim(),
        row?.driverName,
        row?.account?.name,
        row?.Account?.name
      ) || "-",
      phone: firstNonEmpty(driver?.phoneNumber, row?.driverPhone, row?.Account?.phoneNumber, row?.account?.phoneNumber) || "-",
    };
  }

  if (row?.autoId != null || auto) {
    return {
      label: "Auto",
      idLabel: "Auto ID",
      id: firstNonEmpty(row?.autoId, auto?.id) || "-",
      name: firstNonEmpty(auto?.name, [auto?.firstName, auto?.lastName].filter(Boolean).join(" ").trim(), row?.autoName) || "-",
      phone: firstNonEmpty(auto?.phoneNumber, row?.autoPhoneNumber) || "-",
    };
  }

  if (row?.bikeId != null || bike) {
    return {
      label: "Bike",
      idLabel: "Bike ID",
      id: firstNonEmpty(row?.bikeId, bike?.id) || "-",
      name: firstNonEmpty(bike?.name, [bike?.firstName, bike?.lastName].filter(Boolean).join(" ").trim(), row?.bikeName) || "-",
      phone: firstNonEmpty(bike?.phoneNumber, row?.bikePhoneNumber) || "-",
    };
  }

  if (row?.parcelId != null || parcel) {
    return {
      label: "Parcel",
      idLabel: "Parcel ID",
      id: firstNonEmpty(row?.parcelId, parcel?.id) || "-",
      name: firstNonEmpty(parcel?.name, [parcel?.firstName, parcel?.lastName].filter(Boolean).join(" ").trim(), row?.parcelName) || "-",
      phone: firstNonEmpty(parcel?.phoneNumber, row?.parcelPhoneNumber) || "-",
    };
  }

  return null;
};

const parseTransactionsResponse = (payload, fallbackLimit) => {
  const body = payload?.data ?? payload?.result ?? payload;

  let rows = [];
  if (Array.isArray(body)) rows = body;
  else if (Array.isArray(body?.rows)) rows = body.rows;
  else if (Array.isArray(body?.items)) rows = body.items;
  else if (Array.isArray(body?.list)) rows = body.list;
  else if (Array.isArray(body?.data)) rows = body.data;

  const meta = payload?.meta || body?.meta || {};
  const pagination = payload?.pagination || body?.pagination || {};

  const itemsPerPage =
    Number(pagination?.itemsPerPage) ||
    Number(meta?.limit) ||
    Number(body?.limit) ||
    Number(payload?.limit) ||
    Number(fallbackLimit) ||
    10;

  const totalItems =
    Number(pagination?.totalItems) ||
    Number(meta?.total) ||
    Number(body?.total) ||
    Number(payload?.total) ||
    Number(body?.count) ||
    Number(payload?.count) ||
    0;

  const totalPages =
    Number(pagination?.totalPages) ||
    Number(meta?.totalPages) ||
    Number(body?.totalPages) ||
    Number(payload?.totalPages) ||
    (totalItems > 0 ? Math.ceil(totalItems / itemsPerPage) : 1);

  const currentPage =
    Number(pagination?.currentPage) ||
    Number(meta?.page) ||
    Number(body?.page) ||
    Number(payload?.page) ||
    1;

  return {
    rows,
    pagination: { currentPage, totalPages, totalItems: Number(totalItems) || 0, itemsPerPage },
  };
};

const PaymentFailedRecords = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: PAGE_LIMIT,
  });

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        setError("");

        const params = {
          page: pagination.currentPage,
          limit: PAGE_LIMIT,
          status: "FAILED",
          paymentType:"PAYU_SUBSCRIPTION",
        };

        const response = await ApiRequestUtils.getWithQueryParam(API_ROUTES.GET_TRANSACTIONS_LIST, params);

        if (!response?.success) {
          setRows([]);
          setPagination((prev) => ({ ...prev, totalItems: 0, totalPages: 1 }));
          setError("Failed to load transactions.");
          return;
        }

        const parsed = parseTransactionsResponse(response, PAGE_LIMIT);
        setRows(parsed.rows);
        setPagination((prev) => ({
          ...prev,
          currentPage: parsed.pagination.currentPage,
          totalPages: parsed.pagination.totalPages,
          totalItems: parsed.pagination.totalItems,
          itemsPerPage: PAGE_LIMIT,
        }));
      } catch (err) {
        console.error("Error fetching transactions:", err);
        setRows([]);
        setPagination((prev) => ({ ...prev, totalItems: 0, totalPages: 1 }));
        setError("Failed to load transactions.");
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [pagination.currentPage]);

  const visibleRows =
    rows.length > pagination.itemsPerPage
      ? rows.slice((pagination.currentPage - 1) * pagination.itemsPerPage, pagination.currentPage * pagination.itemsPerPage)
      : rows;
  const generatePageButtons = () => {
    const buttons = [];
    const maxVisible = 5;
    let startPage = Math.max(1, pagination.currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(pagination.totalPages, startPage + maxVisible - 1);

    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <Button
          key={i}
          size="sm"
          variant={i === pagination.currentPage ? "filled" : "outlined"}
          className={`mx-1 ${ColorStyles.bgColor} text-white`}
          onClick={() => setPagination((prev) => ({ ...prev, currentPage: i }))}
        >
          {i}
        </Button>
      );
    }

    return buttons;
  };

  return (
    <Card className="border border-blue-gray-100 shadow-sm rounded-2xl">
      <CardBody className="p-4 sm:p-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <Typography variant="h6" className="text-gray-900">
              Payment Failed Records
            </Typography>
          </div>

          <div className="hidden md:block overflow-x-auto">
            <table className="w-full min-w-[980px] table-auto">
              <thead>
                <tr className={ColorStyles.bgColor}>
                  {[
                    "Txn ID",
                    "Driver ID",
                    "Driver",
                    "Phone Number",
                    "Amount",
                    "Status",
                    "Payment Type",
                    "Payment Mode",
                    "Date",
                  ].map((header) => (
                    <th key={header} className="border-b border-blue-gray-50 py-3 px-4 text-left whitespace-nowrap">
                      <Typography variant="small" className="text-[11px] font-bold uppercase text-white whitespace-nowrap">
                        {header}
                      </Typography>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={9} className="py-4 px-4 text-center text-gray-500">Loading transactions...</td></tr>
                ) : error ? (
                  <tr><td colSpan={9} className="py-4 px-4 text-center text-red-500">{error}</td></tr>
                ) : visibleRows.length === 0 ? (
                  <tr><td colSpan={9} className="py-4 px-4 text-center text-gray-500">No transactions found.</td></tr>
                ) : (
                  visibleRows.map((row, idx) => {
                    const subscriptionEntity = row?.paymentType === "PAYU_SUBSCRIPTION" ? resolveSubscriptionEntityDetails(row) : null;
                    const driverDetails = resolveDriverDetails(row);
                    return (
                      <tr key={row.transaction || row.id || idx} className="border-b border-blue-gray-50 text-sm whitespace-nowrap">
                        <td className="py-3 px-4 whitespace-nowrap">{row?.transaction || row?.transactionId || row?.referenceId || row?.id || "-"}</td>
                        <td className="py-3 px-4 whitespace-nowrap">{driverDetails.driverId}</td>
                        <td className="py-3 px-4 whitespace-nowrap"><div className="flex flex-col"><span>{driverDetails.name}</span></div></td>
                        <td className="py-3 px-4 whitespace-nowrap">{driverDetails.phone}</td>
                        <td className="py-3 px-4 whitespace-nowrap font-bold"> ₹ {row.amount ?? row.totalAmount ?? "-"}</td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className={statusBadgeClass(row.status)}>
                            {formatValueWithReadableLabel(row.status)}
                          </span>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">{formatValueWithReadableLabel(row.paymentType)}</td>
                        <td className="py-3 px-4 whitespace-nowrap">{row.paymentMode || "-"}</td>
                        <td className="py-3 px-4 whitespace-nowrap">{formatDateTime(row.updated_at || row.updatedAt || row.createdAt || row.transactionDate || row.date)}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="md:hidden space-y-3">
            {loading ? (
              <div className="text-center text-sm text-gray-500 py-2">Loading transactions...</div>
            ) : error ? (
              <div className="text-center text-sm text-red-500 py-2">{error}</div>
            ) : visibleRows.length === 0 ? (
              <div className="text-center text-sm text-gray-500 py-2">No transactions found.</div>
            ) : (
              visibleRows.map((row, idx) => {
                const subscriptionEntity = row?.paymentType === "PAYU_SUBSCRIPTION" ? resolveSubscriptionEntityDetails(row) : null;
                const driverDetails = resolveDriverDetails(row);
                return (
                  <div key={row.transaction || row.id || idx} className="rounded-xl border border-blue-gray-50 p-3 bg-white">
                    <div className="text-xs text-blue-gray-500">Txn ID</div>
                    <div className="text-sm font-medium break-all">{row?.transaction || row?.transactionId || row?.referenceId || row?.id || "-"}</div>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                      <div><div className="text-xs text-blue-gray-500">Driver ID</div><div>{driverDetails.driverId}</div></div>
                      <div><div className="text-xs text-blue-gray-500">Driver</div><div>{driverDetails.name}</div></div>
                      <div><div className="text-xs text-blue-gray-500">Phone Number</div><div>{driverDetails.phone}</div></div>
                      <div><div className="text-xs text-blue-gray-500">Amount</div><div>{row.amount ?? row.totalAmount ?? "-"}</div></div>
                      <div>
                        <div className="text-xs text-blue-gray-500">Status</div>
                        <div className={statusBadgeClass(row.status)}>{formatValueWithReadableLabel(row.status)}</div>
                      </div>
                      <div><div className="text-xs text-blue-gray-500">Pay Type</div><div>{formatValueWithReadableLabel(row.paymentType)}</div></div>
                      <div><div className="text-xs text-blue-gray-500">Pay Mode</div><div>{row.paymentMode || "-"}</div></div>
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      {formatDateTime(row.updated_at || row.updatedAt || row.createdAt || row.transactionDate || row.date)}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="flex items-center justify-center mt-4">
            <Button
              size="sm"
              variant="text"
              disabled={pagination.currentPage === 1 || loading}
              onClick={() => setPagination((prev) => ({ ...prev, currentPage: Math.max(1, prev.currentPage - 1) }))}
              className="mx-1"
            >
              {'<'}
            </Button>
            {generatePageButtons()}
            <Button
              size="sm"
              variant="text"
              disabled={pagination.currentPage === pagination.totalPages || loading}
              onClick={() =>
                setPagination((prev) => ({
                  ...prev,
                  currentPage: Math.min(prev.totalPages, prev.currentPage + 1),
                }))
              }
              className="mx-1"
            >
              {'>'}
            </Button>
          </div>
        </div>
      </CardBody>
    </Card>
  );
};

export default PaymentFailedRecords;