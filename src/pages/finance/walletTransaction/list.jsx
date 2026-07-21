import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button, Card, CardBody, Spinner, Typography } from "@material-tailwind/react";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { API_ROUTES, ColorStyles } from "@/utils/constants";
import Swal from "sweetalert2";
import WalletTransactionFilters from "./components/WalletTransactionFilters";
import WalletTransactionTable from "./components/WalletTransactionTable";
import WalletTransactionReviewPanel from "./components/WalletTransactionReviewPanel";
import { normalizeRows } from "./utils";

const WalletTransactionList = () => {
  const [items, setItems] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [searchParams, setSearchParams] = useState({ entityType: "", tier: "", status: "" });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 20,
  });
  const [status, setStatus] = useState("IN_PROGRESS");
  const [paymentTransactionId, setPaymentTransactionId] = useState("");
  const [adminReason, setAdminReason] = useState("");
  const reviewRef = useRef(null);

  const selectedRow = useMemo(() => items.find((item) => String(item?.id) === String(selectedId)) || null, [items, selectedId]);
  const selectedStatus = String(status || "IN_PROGRESS").toUpperCase();
  const isTerminalStatus = ["PAID", "REJECTED"].includes(String(selectedRow?.status || "").toUpperCase());
  const isNotEligible = String(selectedRow?.status || "").toUpperCase() === "IN_PROGRESS" && selectedRow?.isStillEligibleForPayment === false;

  const fetchWalletTransactions = async (page = pagination.currentPage, nextFilters = searchParams) => {
    try {
      setLoading(true);
      setError("");
      const query = Object.fromEntries(Object.entries(nextFilters || {}).filter(([, value]) => value !== "" && value !== null && value !== undefined));
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
      setPagination((prev) => ({ ...prev, currentPage, totalPages, totalItems, itemsPerPage }));
      if (!rows.length) setError("No withdrawal requests found.");
    } catch (err) {
      console.error("Failed to fetch withdrawal requests:", err);
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
        if (response?.success) setAllUsers(normalizeRows(response?.data));
      } catch (err) {
        console.error("Error fetching users:", err);
      }
    };
    fetchAllUsers();
  }, []);

  useEffect(() => {
    if (!selectedRow) return;
    const rowStatus = String(selectedRow?.status || "IN_PROGRESS").toUpperCase();
    setStatus(rowStatus === "IN_PROGRESS" && selectedRow?.isStillEligibleForPayment === false ? "REJECTED" : rowStatus);
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
        className={`mx-1 ${page === pagination.currentPage ? `${ColorStyles.bgColor} text-white` : "border-blue-500 text-blue-500"}`}
      >
        {page}
      </Button>
    ));
  };

  const handleUpdateStatus = async () => {
    const id = selectedRow?.id;
    if (!id) return;
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
            <div className="flex flex-col gap-2 xl:flex-row xl:items-end xl:justify-between">
              <div className="max-w-3xl">
                <Typography variant="h6" className="text-2xl font-semibold text-slate-900">
                  Withdrawal Requests
                </Typography>
                <Typography className="text-sm text-slate-500">Review pending requests and pay or reject them</Typography>
              </div>
                <Button
                  variant="outlined"
                  onClick={() => fetchWalletTransactions(pagination.currentPage)}
                  disabled={loading || saving}
                  className="self-start rounded-full bg-red-600 px-5 py-3 text-xs font-semibold text-white shadow-sm hover:shadow-md disabled:opacity-60"
                >
                  <span className="flex items-center gap-2">
                    {loading ? <Spinner className="h-4 w-4" /> : null}
                    {loading ? "Refreshing..." : "Refresh"}
                  </span>
                </Button>
            </div>

            <WalletTransactionFilters
              searchParams={searchParams}
              onFilterChange={handleFilterChange}
              onApplyFilters={handleApplyFilters}
              onClearFilters={handleClearFilters}
            />

            {loading ? (
              <div className="mt-6 flex justify-center">
                <Spinner />
              </div>
            ) : null}
            {error ? <Typography className="mt-4 text-sm text-red-600">{error}</Typography> : null}

            <div className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
              <div>
                <WalletTransactionTable items={items} selectedId={selectedId} onSelectRow={handleSelectRow} allUsers={allUsers} />
                <div className="mt-4 flex items-center justify-center">
                  <Button size="sm" variant="outlined" disabled={pagination.currentPage === 1 || loading} onClick={() => handlePageChange(pagination.currentPage - 1)} className="mx-1">
                    {"<"}
                  </Button>
                  {renderPageButtons()}
                  <Button size="sm" variant="outlined" disabled={pagination.currentPage === pagination.totalPages || loading} onClick={() => handlePageChange(pagination.currentPage + 1)} className="mx-1">
                    {">"}
                  </Button>
                </div>
              </div>

              <WalletTransactionReviewPanel
                selectedRow={selectedRow}
                selectedStatus={selectedStatus}
                onStatusChange={setStatus}
                paymentTransactionId={paymentTransactionId}
                onPaymentTransactionIdChange={setPaymentTransactionId}
                adminReason={adminReason}
                onAdminReasonChange={setAdminReason}
                onUpdateStatus={handleUpdateStatus}
                saving={saving}
                isTerminalStatus={isTerminalStatus}
                isNotEligible={isNotEligible}
                reviewRef={reviewRef}
              />
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

export default WalletTransactionList;