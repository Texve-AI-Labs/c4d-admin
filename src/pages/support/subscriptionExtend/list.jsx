import React, { useEffect, useState } from "react";
import { Button, Card, CardBody, Input, Option, Select, Spinner, Typography } from "@material-tailwind/react";
import { useNavigate } from "react-router-dom";
import { ColorStyles } from "@/utils/constants";
import { fetchExpiredSubscriptions } from "./subscriptionExtendApi";
import {
  PAGE_LIMIT,
  associatedStatusOptions,
  driverTypeOptions,
  earningStrategyOptions,
  emptyFilters,
  formatAmount,
  formatDateTime,
  formatLabel,
  getAccountName,
  getDriverName,
  getDriverPhone,
  getEntityName,
  getEntityNumber,
  getStatusBadgeClass,
  getSubscriptionId,
  normalizeExpiredSubscriptionsResponse,
  resolvePagination,
} from "./subscriptionExtendUtils";

function SubscriptionExtendList() {
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
      const response = await fetchExpiredSubscriptions(buildQuery(page, activeFilters));
      if (response?.success === false) {
        setRows([]);
        setError(response?.error || response?.message || "Failed to load expired subscriptions.");
        setPagination((prev) => ({ ...prev, currentPage: 1, totalPages: 1, totalItems: 0 }));
        return;
      }

      const nextRows = normalizeExpiredSubscriptionsResponse(response);
      setRows(nextRows);
      setPagination((prev) => ({
        ...prev,
        ...resolvePagination(response, nextRows, page, prev.itemsPerPage),
      }));
    } catch (err) {
      console.error("Error fetching expired subscriptions:", err);
      setRows([]);
      setError(err?.response?.data?.error || err?.response?.data?.message || "Failed to load expired subscriptions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRows(pagination.currentPage, filters);
  }, [pagination.currentPage, pagination.itemsPerPage]);

  const applyFilters = () => {
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
    fetchRows(1, filters);
  };

  const clearFilters = () => {
    setFilters(emptyFilters);
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

  const goToExtend = (row) => {
    const subscriptionId = getSubscriptionId(row);
    if (!subscriptionId) {
      setError("Subscription id is missing for this record.");
      return;
    }
    navigate(`/dashboard/support/subscription-extend/edit/${subscriptionId}`, { state: { row } });
  };

  const headers = [
    "Driver",
    "Phone",
    "Driver Type",
    "Entity",
    "Vehicle No",
    "Account",
    "Plan",
    "Strategy",
    "Sub Status",
    "Entity Status",
    "End Date",
    "Unused Credit",
    "Action",
  ];

  return (
    <div className="mb-8 mt-8 flex flex-col gap-6">
      <Card>
        <CardBody className="flex flex-col gap-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <Typography variant="h6" color="black">
              Subscription Extend
            </Typography>
          </div>

          {error && <div className="rounded-md bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            
            <Select label="Driver Type" value={filters.driverType} onChange={(value) => setFilters((prev) => ({ ...prev, driverType: value }))}>
              {driverTypeOptions.map((option) => (
                <Option key={option.value} value={option.value}>{option.label}</Option>
              ))}
            </Select>
            <Select label="Earning Strategy" value={filters.earningStrategy} onChange={(value) => setFilters((prev) => ({ ...prev, earningStrategy: value }))}>
              {earningStrategyOptions.map((option) => (
                <Option key={option.value} value={option.value}>{option.label}</Option>
              ))}
            </Select>
            <Select label="Associated  Vehicle Status" value={filters.associatedStatus} onChange={(value) => setFilters((prev) => ({ ...prev, associatedStatus: value }))}>
              {associatedStatusOptions.map((option) => (
                <Option key={option.value} value={option.value}>{option.label}</Option>
              ))}
            </Select>
          </div>
              <div className="flex gap-2">
              <Button className={`${ColorStyles.bgColor} flex-1 text-white`} onClick={applyFilters} disabled={loading}>
                Filter
              </Button>
              <Button variant="outlined" className="flex-1" onClick={clearFilters} disabled={loading}>
                Clear
              </Button>
            </div>

          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[1500px] table-auto">
              <thead>
                <tr className={ColorStyles.bgColor}>
                  {headers.map((header) => (
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
                  <tr><td colSpan={headers.length} className="py-6 text-center"><Spinner className="mx-auto h-6 w-6" /></td></tr>
                ) : rows.length === 0 ? (
                  <tr><td colSpan={headers.length} className="py-6 text-center text-sm text-blue-gray-500">No expired subscriptions found.</td></tr>
                ) : (
                  rows.map((row, index) => (
                    <tr key={getSubscriptionId(row) || index} className="border-b border-blue-gray-50 text-sm">
                      <td className="px-3 py-3 whitespace-nowrap">{getDriverName(row)}</td>
                      <td className="px-3 py-3 whitespace-nowrap">{getDriverPhone(row)}</td>
                      <td className="px-3 py-3 whitespace-nowrap">{formatLabel(row?.driverType || row?.driver?.driverType)}</td>
                      <td className="px-3 py-3 whitespace-nowrap">{getEntityName(row)}</td>
                      <td className="px-3 py-3 whitespace-nowrap">{getEntityNumber(row)}</td>
                      <td className="px-3 py-3 whitespace-nowrap">{getAccountName(row)}</td>
                      <td className="px-3 py-3 whitespace-nowrap">{row?.subscription?.Plan?.name || "-"}</td>
                      <td className="px-3 py-3 whitespace-nowrap">{formatLabel(row?.subscription?.earningStrategy)}</td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadgeClass(row?.subscription?.status)}`}>
                          {formatLabel(row?.subscription?.status)}
                        </span>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadgeClass(row?.associatedStatus || row?.associatedEntity?.subscriptionStatus)}`}>
                          {formatLabel(row?.associatedStatus || row?.associatedEntity?.subscriptionStatus)}
                        </span>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">{formatDateTime(row?.subscription?.endDate)}</td>
                      <td className="px-3 py-3 whitespace-nowrap font-semibold">{formatAmount(row?.subscription?.expiredUnusedEarning)}</td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <Button size="sm" className={`${ColorStyles.bgColor} text-white`} onClick={() => goToExtend(row)}>
                          Extend
                        </Button>
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
              <div className="py-6 text-center text-sm text-blue-gray-500">No expired subscriptions found.</div>
            ) : (
              rows.map((row, index) => (
                <div key={getSubscriptionId(row) || index} className="rounded-lg border border-blue-gray-50 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Typography variant="small" className="font-semibold text-blue-gray-900">{getDriverName(row)}</Typography>
                      <div className="text-xs text-blue-gray-500">{getDriverPhone(row)}</div>
                    </div>
                    <Button size="sm" className={`${ColorStyles.bgColor} text-white`} onClick={() => goToExtend(row)}>Extend</Button>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <div><div className="text-xs text-blue-gray-500">Driver Type</div><div>{formatLabel(row?.driverType || row?.driver?.driverType)}</div></div>
                    <div><div className="text-xs text-blue-gray-500">Entity</div><div>{getEntityName(row)}</div></div>
                    <div><div className="text-xs text-blue-gray-500">Vehicle No</div><div>{getEntityNumber(row)}</div></div>
                    <div><div className="text-xs text-blue-gray-500">Plan</div><div>{row?.subscription?.Plan?.name || "-"}</div></div>
                    <div><div className="text-xs text-blue-gray-500">Strategy</div><div>{formatLabel(row?.subscription?.earningStrategy)}</div></div>
                    <div><div className="text-xs text-blue-gray-500">Unused Credit</div><div>{formatAmount(row?.subscription?.expiredUnusedEarning)}</div></div>
                  </div>
                  <div className="mt-2 text-xs text-gray-500">Expired: {formatDateTime(row?.subscription?.endDate)}</div>
                </div>
              ))
            )}
          </div>

          <div className="flex items-center justify-center pt-2">
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

export default SubscriptionExtendList;