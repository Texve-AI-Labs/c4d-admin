import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button, Card, CardBody, Dialog, DialogBody, DialogHeader, Input, Option, Select, Spinner, Textarea, Typography } from "@material-tailwind/react";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { API_ROUTES, ColorStyles } from "@/utils/constants";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

const ENTITY_TYPE_OPTIONS = [
  { label: "All", value: "" },
  { label: "Cab", value: "CAB" },
  { label: "Auto", value: "AUTO" },
  { label: "Bike", value: "BIKE" },
  { label: "Parcel", value: "PARCEL" },
  { label: "Driver", value:"DRIVER" },
];

const badgeClassByValue = (value) => {
  const normalized = String(value || "").toUpperCase();
  if (normalized === "IN_PROGRESS") return "bg-amber-100 text-amber-800 border-amber-200";
  if (normalized === "PAID" || normalized === "COMPLETED" || normalized === "SUCCESS") return "bg-green-100 text-green-700 border-green-200";
  if (normalized === "FAILED" || normalized === "REJECTED" || normalized === "CANCELLED") return "bg-red-100 text-red-700 border-red-200";
  if (normalized === "SILVER") return "bg-slate-100 text-slate-700 border-slate-200";
  if (normalized === "GOLD") return "bg-amber-100 text-amber-700 border-amber-200";
  if (normalized === "ELITE") return "bg-violet-100 text-violet-700 border-violet-200";
  return "bg-gray-100 text-gray-700 border-gray-200";
};

const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

const normalizeRows = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.data?.items)) return payload.data.items;
  if (Array.isArray(payload?.result?.items)) return payload.result.items;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.result)) return payload.result;
  return [];
};

const formatProcessedBy = (value) => {
  if (!value) return "-";
  if (typeof value === "string" || typeof value === "number") return String(value);
  return (
    value?.name ||
    value?.fullName ||
    value?.userName ||
    value?.processedByName ||
    value?.email ||
    value?.phoneNumber ||
    value?.id ||
    "-"
  );
};

const WalletTransactionList = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [searchParams, setSearchParams] = useState({
    entityType: "",
    tier: "",
    status: "",
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 20,
  });
  const [status, setStatus] = useState("IN_PROGRESS");
  const [paymentTransactionId, setPaymentTransactionId] = useState("");
  const [adminReason, setAdminReason] = useState("");
  const [allUsers, setAllUsers] = useState([]);
  const reviewRef = useRef(null);

  const selectedRow = useMemo(
    () => items.find((item) => String(item?.id) === String(selectedId)) || null,
    [items, selectedId]
  );
  const isTerminalStatus = ["PAID", "REJECTED"].includes(String(selectedRow?.status || "").toUpperCase());

  const fetchWalletTransactions = async (page = pagination.currentPage, nextFilters = searchParams) => {
    try {
      setLoading(true);
      setError("");
      const query = Object.fromEntries(
        Object.entries(nextFilters || {}).filter(([, value]) => value !== "" && value !== null && value !== undefined)
      );
      query.page = page;
      query.limit = pagination.itemsPerPage;
      const res = await ApiRequestUtils.getWithQueryParam(API_ROUTES.ADMIN_WITHDRAWALS_GET, query);
      const rows = normalizeRows(res?.data);
      setItems(rows);
      const meta = res?.data || res?.result || {};
      const totalItems = Number(meta?.total || meta?.totalItems || rows.length || 0);
      const totalPages = Number(meta?.totalPages || (totalItems > 0 ? Math.ceil(totalItems / Math.max(pagination.itemsPerPage, 1)) : 1));
      const currentPage = Number(meta?.page || page || 1);
      const itemsPerPage = Number(meta?.limit || meta?.itemsPerPage || pagination.itemsPerPage || 20);
      setPagination((prev) => ({
        ...prev,
        currentPage,
        totalPages,
        totalItems,
        itemsPerPage,
      }));
      if (!rows.length) setError("No withdrawal requests found.");
    } catch (error) {
      console.error("Failed to fetch wallet transactions:", error);
      setItems([]);
      setError("Failed to fetch withdrawal requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWalletTransactions(1);
  }, []);

  useEffect(() => {
    const fetchAllUsers = async () => {
      try {
        const response = await ApiRequestUtils.get(API_ROUTES.GET_ALL_USERS);
        if (response?.success) {
          setAllUsers(response?.data || []);
        }
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    fetchAllUsers();
  }, []);

  useEffect(() => {
    if (!selectedRow) return;
    setStatus(String(selectedRow?.status || "IN_PROGRESS").toUpperCase());
    setPaymentTransactionId(selectedRow?.paymentTransactionId || "");
    setAdminReason(selectedRow?.adminReason || "");
  }, [selectedRow]);

  const handleSelectRow = (row) => {
    if (!row?.id) return;
    setSelectedId(row.id);
    requestAnimationFrame(() => {
      reviewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const resolveUserName = (userId) => {
    const targetId = String(userId ?? "").trim();
    if (!targetId) return "-";
    const matchedUser = allUsers.find((user) =>
      String(user?.id ?? user?._id ?? user?.userId ?? "").trim() === targetId
    );
    return matchedUser?.name || matchedUser?.fullName || matchedUser?.userName || matchedUser?.email || targetId;
  };

  const handleFilterChange = (key, value) => {
    setSearchParams((prev) => ({ ...prev, [key]: value }));
  };

  const handleApplyFilters = () => {
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
    fetchWalletTransactions(1, searchParams);
  };

  const handleClearFilters = () => {
    const reset = { entityType: "", tier: "", status: "" };
    setSearchParams(reset);
    setSelectedId("");
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
    fetchWalletTransactions(1, reset);
  };

  const handlePageChange = (page) => {
    if (page < 1 || page > pagination.totalPages || loading) return;
    setPagination((prev) => ({ ...prev, currentPage: page }));
    fetchWalletTransactions(page);
  };

  const renderPageButtons = () => {
    const maxVisible = 5;
    const startPage = Math.max(1, pagination.currentPage - Math.floor(maxVisible / 2));
    const endPage = Math.min(pagination.totalPages, startPage + maxVisible - 1);
    const pages = [];
    for (let page = startPage; page <= endPage; page += 1) pages.push(page);
    return pages.map((page) => (
      <Button
        key={page}
        size="sm"
        variant={page === pagination.currentPage ? "filled" : "outlined"}
        onClick={() => handlePageChange(page)}
        disabled={loading}
        className={`mx-1 ${page === pagination.currentPage ? ColorStyles.bgColor + " text-white" : "border-blue-500 text-blue-500"}`}
      >
        {page}
      </Button>
    ));
  };

  const handleUpdateStatus = async () => {
    const id = selectedRow?.id;
    if (!id) return;
    if (!status) {
      setError("Select a status.");
      return;
    }
    const normalizedStatus = String(status).toUpperCase();
    if (!["PAID", "REJECTED"].includes(normalizedStatus)) {
      setError("Status must be PAID or REJECTED.");
      return;
    }
    if (normalizedStatus === "PAID" && !String(paymentTransactionId || "").trim()) {
      setError("Payment Transaction ID is required when marking as PAID.");
      return;
    }
    const payload = {
      status: normalizedStatus,
      paymentTransactionId: paymentTransactionId || undefined,
      adminReason: adminReason || undefined,
    };
    try {
      setSaving(true);
      setError("");
      const response = await ApiRequestUtils.update(`${API_ROUTES.ADMIN_WITHDRAWALS_UPDATE}/${id}`, payload);
      if (response?.success) {
        await fetchWalletTransactions(pagination.currentPage);
        setSelectedId("");
        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "success",
          title: "Withdrawal request updated",
          showConfirmButton: false,
          timer: 1800,
        });
      } else {
        setError(response?.message || "Failed to update withdrawal request.");
      }
    } catch (err) {
      console.error("Failed to update withdrawal request:", err);
      setError(err?.response?.data?.message || err?.message || "Failed to update withdrawal request.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-2 bg-white rounded-lg shadow-sm">
      <div className="relative overflow-hidden rounded-[30px]">
        <Card className="relative m-2 border border-gray-300 bg-white shadow-sm">
          <CardBody>
            <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
              <div className="max-w-3xl">
                <Typography variant="h6" className="text-2xl font-semibold text-slate-900">
                  Wallet Transaction List
                </Typography>
                <Typography className="text-sm text-slate-500">
                  Review and process withdrawal requests
                </Typography>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="outlined"
                  onClick={() => fetchWalletTransactions(pagination.currentPage)}
                  disabled={loading || saving}
                  className="rounded-full bg-red-600 px-5 py-3 text-xs font-semibold text-white shadow-sm hover:shadow-md disabled:opacity-60"
                >
                  <span className="flex items-center gap-2">
                    {loading ? <Spinner className="h-4 w-4" /> : null}
                    {loading ? "Refreshing..." : "Refresh"}
                  </span>
                </Button>
              </div>
            </div>

            <div className="mt-5 rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <Typography className="text-sm font-semibold uppercase tracking-wide text-slate-700">
                Filter Section
                </Typography>
                <Typography className="text-xs text-slate-500">
                  Clear the filters to view the full queue
                </Typography>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <Select
                  label="Entity Type"
                  value={searchParams.entityType}
                  onChange={(value) => handleFilterChange("entityType", value || "")}
                >
                  {ENTITY_TYPE_OPTIONS.map((option) => (
                    <Option key={option.value || "all"} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
                <Select
                  label="Tier"
                  value={searchParams.tier}
                  onChange={(value) => handleFilterChange("tier", value || "")}
                >
                  <Option value="">All</Option>
                  <Option value="SILVER">Silver</Option>
                  <Option value="GOLD">Gold</Option>
                  <Option value="ELITE">Elite</Option>
                </Select>
                <Select
                  label="Status"
                  value={searchParams.status}
                  onChange={(value) => handleFilterChange("status", value || "")}
                >
                  <Option value="">All</Option>
                  <Option value="IN_PROGRESS">In Progress</Option>
                  <Option value="PAID">Paid</Option>
                  <Option value="REJECTED">Rejected</Option>
                </Select>
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                <Button onClick={handleApplyFilters} className="rounded-full bg-blue-900 px-5 py-3 text-xs font-semibold text-white shadow-sm hover:shadow-md">
                  Apply Filters
                </Button>
                <Button variant="outlined" onClick={handleClearFilters} className="rounded-full border-slate-300 px-5 py-3 text-xs font-semibold text-slate-700">
                  Clear Filters
                </Button>
              </div>
            </div>

            {loading ? (
              <div className="mt-6 flex justify-center">
                <Spinner />
              </div>
            ) : null}

            {error ? <Typography className="mt-4 text-sm text-red-600">{error}</Typography> : null}

            <div className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead className="bg-primary text-white">
                      <tr className="border-b border-slate-200 bg-slate-900 text-left">
                        <th className="p-2 text-sm font-semibold text-black-100">Action</th>
                        <th className="p-2 text-sm font-semibold text-black-100">Entity Type</th>
                        <th className="p-2 text-sm font-semibold text-black-100">Entity Name</th>
                        <th className="p-2 text-sm font-semibold text-black-100">Tier</th>
                        <th className="p-2 text-sm font-semibold text-black-100">Amount</th>
                        <th className="p-2 text-sm font-semibold text-black-100">Status</th>
                        <th className="p-2 text-sm font-semibold text-black-100">Wallet Before</th>
                        <th className="p-2 text-sm font-semibold text-black-100">Wallet After</th>
                        <th className="p-2 text-sm font-semibold text-black-100">Entity Balance</th>
                        <th className="p-2 text-sm font-semibold text-black-100">Processed By</th>
                        <th className="p-2 text-sm font-semibold text-black-100">Processed At</th>
                        <th className="p-2 text-sm font-semibold text-black-100">Payment Txn</th>
                        <th className="p-2 text-sm font-semibold text-black-100">Admin Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, index) => {
                        const id = item?.id;
                        const isSelected = String(id) === String(selectedId);
                        return (
                          <tr
                            key={`${id || "row"}-${index}`}
                            className={`border-b border-slate-100 align-top transition ${isSelected ? "bg-sky-50" : "hover:bg-slate-50"}`}
                          >
                            <td className="p-3 text-sm whitespace-nowrap">
                              <Button
                                size="sm"
                                onClick={() => handleSelectRow(item)}
                                className="rounded-full bg-gradient-to-r from-sky-600 to-cyan-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:shadow-md"
                              >
                                Review
                              </Button>
                            </td>
                            <td className="p-3 text-sm whitespace-nowrap">
                              <div className="font-semibold text-black-950">{item?.entityType || "-"}</div>
                            </td>
                            <td className="p-3 text-sm whitespace-nowrap">
                              <div className="font-semibold text-black-950">{item?.entityName || "-"}</div>
                            </td>
                            <td className="p-3 text-sm whitespace-nowrap">
                              <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold shadow-sm ${badgeClassByValue(item?.tier)}`}>
                                {item?.tier || "-"}
                              </span>
                            </td>
                            <td className="p-3 text-sm whitespace-nowrap">{item?.amount ?? "-"}</td>
                            <td className="p-3 text-sm whitespace-nowrap">
                              <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold shadow-sm ${badgeClassByValue(item?.status)}`}>
                                {item?.status || "-"}
                              </span>
                            </td>
                            <td className="p-3 text-sm whitespace-nowrap">{item?.walletBalanceBefore ?? "-"}</td>
                            <td className="p-3 text-sm whitespace-nowrap">{item?.walletBalanceAfter ?? "-"}</td>
                            <td className="p-3 text-sm whitespace-nowrap">{item?.entityBalance ?? "-"}</td>
                            <td className="p-3 text-sm whitespace-nowrap">
                              {typeof item?.processedBy === "object"
                                ? formatProcessedBy(item?.processedBy)
                                : resolveUserName(item?.processedBy)}
                            </td>
                            <td className="p-3 text-sm whitespace-nowrap">{formatDateTime(item?.processedAt)}</td>
                            <td className="p-3 text-sm whitespace-nowrap">{item?.paymentTransactionId ?? "-"}</td>
                            <td className="p-3 text-sm whitespace-nowrap text-black-700">{item?.adminReason ?? "-"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 flex items-center justify-center">
                  <Button
                    size="sm"
                    variant="outlined"
                    disabled={pagination.currentPage === 1 || loading}
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    className="mx-1"
                  >
                    {"<"}
                  </Button>
                  {renderPageButtons()}
                  <Button
                    size="sm"
                    variant="outlined"
                    disabled={pagination.currentPage === pagination.totalPages || loading}
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    className="mx-1"
                  >
                    {">"}
                  </Button>
                </div>
              </div>

              <div ref={reviewRef} className="xl:sticky xl:top-6 h-fit overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 bg-gradient-to-r from-slate-900 to-slate-700 px-5 py-4">
                  <Typography variant="h6" className="text-white">
                    Withdrawal Review
                  </Typography>
                  <Typography className="mt-1 text-sm text-slate-200">
                    Selected request details
                  </Typography>
                </div>
                <div className="p-5">
                  {selectedRow ? (
                    <div className="space-y-4">
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <div className="text-slate-500">Entity Type</div>
                            <div className="font-semibold text-slate-900">{selectedRow?.entityType || "-"}</div>
                          </div>
                          <div>
                            <div className="text-slate-500">Entity Name</div>
                            <div className="font-semibold text-slate-900">{selectedRow?.entityName || "-"}</div>
                          </div>
                          <div>
                            <div className="text-slate-500">Requested Amount</div>
                            <div className="font-semibold text-slate-900">{selectedRow?.amount ?? "-"}</div>
                          </div>
                          <div>
                            <div className="text-slate-500">Current Status</div>
                            <div className="font-semibold text-slate-900">{selectedRow?.status || "-"}</div>
                          </div>
                          <div>
                            <div className="text-slate-500">Wallet Before</div>
                            <div className="font-semibold text-slate-900">{selectedRow?.walletBalanceBefore ?? "-"}</div>
                          </div>
                          <div>
                            <div className="text-slate-500">Wallet After</div>
                            <div className="font-semibold text-slate-900">{selectedRow?.walletBalanceAfter ?? "-"}</div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Typography className="text-sm font-semibold text-slate-700">
                            Status
                          </Typography>
                          <Select
                            value={String(status || "IN_PROGRESS").toUpperCase()}
                            label="Status"
                            onChange={(value) => setStatus(value || "IN_PROGRESS")}
                            disabled={isTerminalStatus}
                          >
                            <Option value="PAID">Paid</Option>
                            <Option value="REJECTED">Rejected</Option>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Typography className="text-sm font-semibold text-slate-700">
                            Payment Transaction ID
                          </Typography>
                          <Input
                            type="text"
                            value={paymentTransactionId}
                            onChange={(e) => setPaymentTransactionId(e.target.value)}
                            disabled={isTerminalStatus}
                            className="!border-slate-300 !text-black placeholder:!text-black/40"
                          />
                        </div>

                        <div className="space-y-2">
                          <Typography className="text-sm font-semibold text-slate-700">
                            Admin Reason
                          </Typography>
                          <Textarea
                            value={adminReason}
                            onChange={(e) => setAdminReason(e.target.value)}
                            disabled={isTerminalStatus}
                            className="!border-slate-300 !text-black placeholder:!text-black/40"
                          />
                        </div>

                        <Button
                          onClick={handleUpdateStatus}
                          disabled={saving || isTerminalStatus}
                          className="w-full rounded-full bg-gradient-to-r from-slate-900 to-slate-700 px-4 py-3 text-xs font-bold uppercase tracking-wide text-white shadow-none disabled:opacity-60"
                        >
                          {saving ? "Saving..." : "Update Status"}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Typography className="text-sm text-slate-600">
                      Select a withdrawal request to open its review panel.
                    </Typography>
                  )}
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

export default WalletTransactionList;