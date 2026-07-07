import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button, Card, CardBody, Dialog, DialogBody, DialogHeader, Input, Option, Select, Spinner, Textarea, Typography } from "@material-tailwind/react";
import moment from "moment";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { API_ROUTES } from "@/utils/constants";

const STATUS_OPTIONS = ["OPEN", "UNDER_REVIEW", "APPROVED", "REJECTED", "RESOLVED"];
const STATUS_FLOW = {
  OPEN: ["UNDER_REVIEW"],
  UNDER_REVIEW: ["APPROVED", "REJECTED"],
  APPROVED: ["RESOLVED"],
  REJECTED: ["RESOLVED"],
  RESOLVED: [],
};
const formatDateTime = (value) => {
  if (!value) return "-";
  const parsed = moment(value);
  if (!parsed.isValid()) return String(value);
  return parsed.format("DD-MM-YYYY hh:mm A");
};

const normalizeRows = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.history)) return payload.history;
  if (payload && typeof payload === "object") return [payload];
  return [];
};

const formatBadgeText = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

const formatCurrency = (value) => {
  if (value === null || value === undefined || value === "") return "-";
  const num = Number(value);
  if (Number.isNaN(num)) return String(value);
  return `₹ ${num.toFixed(2)}`;
};

const getStatusTone = (value) => {
  const normalized = String(value || "").toUpperCase();
  if (normalized === "APPROVED") return "bg-green-600 text-white border-emerald-600";
  if (normalized === "REJECTED") return "bg-red-800 text-white border-rose-600";
  if (normalized === "RESOLVED") return "bg-gray-600 text-white border-sky-600";
  if (normalized === "OPEN") return "bg-amber-500 text-white border-amber-500";
  return "bg-blue-700 text-white border-slate-700";
};

const getAllowedStatusOptions = (currentStatus) => {
  const normalized = String(currentStatus || "").toUpperCase();
  if (!normalized) return STATUS_OPTIONS;
  return [normalized, ...(STATUS_FLOW[normalized] || [])];
};

const isTerminalStatus = (value) => ["APPROVED", "REJECTED", "RESOLVED"].includes(String(value || "").toUpperCase());

const buildRoute = (route, id) =>
  route
    .replace(":id", encodeURIComponent(id))
    .replace(":ticketId", encodeURIComponent(id));

const isPdfFile = (src = "") =>
  String(src).toLowerCase().includes(".pdf") || String(src).toLowerCase().startsWith("data:application/pdf");

const DocumentPreview = ({ src }) => {
  if (!src) return null;
  const previewClassName = isPdfFile(src)
    ? "w-full h-[65vh] border border-gray-200 bg-white overflow-hidden"
    : "w-full h-[65vh] border border-gray-200 bg-white p-2 overflow-hidden";

  return (
    <div className="w-full">
      <div className={previewClassName}>
        {isPdfFile(src) ? (
          <iframe src={src} className="h-full w-full" title="Proof preview" />
        ) : (
          <img
            src={src}
            alt="Proof preview"
            className="h-full w-full select-none object-contain"
            draggable={false}
          />
        )}
      </div>
    </div>
  );
};

function SupportReviewRewardManagement() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
  });
  const [filters, setFilters] = useState({
    status: "",
    raisedByType: "",
    bookingId: "",
    category: "",
    fromDate: "",
    toDate: "",
  });
  const [selectedId, setSelectedId] = useState("");
  const [status, setStatus] = useState("UNDER_REVIEW");
  const [rewardAmount, setRewardAmount] = useState("");
  const [rewardReason, setRewardReason] = useState("");
  const [adminRemarks, setAdminRemarks] = useState("");
  const [proofOpen, setProofOpen] = useState(false);
  const ticketReviewRef = useRef(null);

  const selectedRow = useMemo(
    () =>
      rows.find(
        (item) =>
          String(item?.ticketId || "") === String(selectedId || "") ||
          String(item?.id || "") === String(selectedId || "")
      ) || null,
    [rows, selectedId]
  );
  const selectedTicketKey = selectedRow?.ticketId || selectedRow?.id;

  const fetchTickets = async (page = pagination.currentPage, nextFilters = filters) => {
    setLoading(true);
    setError("");
    try {
      const query = Object.fromEntries(
        Object.entries(nextFilters || {}).filter(([, value]) => value !== "" && value !== null && value !== undefined)
      );
      query.page = page;
      query.limit = pagination.itemsPerPage;
      const response = await ApiRequestUtils.getWithQueryParam(API_ROUTES.SUPPORT_TICKETS, query);
      const ticketRows = normalizeRows(response?.data);
      setRows(ticketRows);
      const meta = response?.meta || response?.data?.meta || {};
      const nextPagination = response?.pagination || response?.data?.pagination || {};
      const totalItems = Number(meta?.count || nextPagination?.totalItems || ticketRows.length || 0);
      const totalPages = Number(
        nextPagination?.totalPages ||
          (totalItems > 0 ? Math.ceil(totalItems / Math.max(pagination.itemsPerPage, 1)) : 1)
      );
      const currentPage = Number(nextPagination?.currentPage || page || 1);
      setPagination((prev) => ({
        ...prev,
        currentPage,
        totalPages,
        totalItems,
        itemsPerPage: Number(nextPagination?.itemsPerPage || prev.itemsPerPage || 10),
      }));
      if (!ticketRows.length) setError("No tickets found.");
    } catch (err) {
      console.error("Failed to fetch support tickets:", err);
      setRows([]);
      setError("Failed to fetch support tickets.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets(1);
  }, []);

  useEffect(() => {
    if (!selectedRow) return;
    setStatus(String(selectedRow?.status || "UNDER_REVIEW").toUpperCase());
    setRewardAmount(selectedRow?.rewardAmount ?? "");
    setRewardReason(selectedRow?.rewardReason ?? "");
    setAdminRemarks(selectedRow?.adminRemarks ?? "");
  }, [selectedRow]);

  const handleSelectTicket = (item) => {
    const id = item?.ticketId || item?.id;
    if (!id) return;
    setSelectedId(id);
    requestAnimationFrame(() => {
      ticketReviewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const handleRefresh = async () => {
    setError("");
    setSelectedId("");
    setProofOpen(false);
    await fetchTickets(pagination.currentPage);
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleApplyFilters = async () => {
    setSelectedId("");
    setProofOpen(false);
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
    await fetchTickets(1, filters);
  };

  const handleClearFilters = async () => {
    const resetFilters = {
      status: "",
      raisedByType: "",
      bookingId: "",
      category: "",
      fromDate: "",
      toDate: "",
    };
    setFilters(resetFilters);
    setSelectedId("");
    setProofOpen(false);
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
    await fetchTickets(1, resetFilters);
  };

  const handlePageChange = (page) => {
    if (page < 1 || page > pagination.totalPages || loading) return;
    setPagination((prev) => ({ ...prev, currentPage: page }));
    fetchTickets(page);
  };

  const renderPageButtons = () => {
    const maxVisible = 5;
    const startPage = Math.max(1, pagination.currentPage - Math.floor(maxVisible / 2));
    const endPage = Math.min(pagination.totalPages, startPage + maxVisible - 1);
    const pages = [];
    for (let page = startPage; page <= endPage; page += 1) {
      pages.push(page);
    }
    return pages.map((page) => (
      <Button
        key={page}
        size="sm"
        variant={page === pagination.currentPage ? "filled" : "outlined"}
        onClick={() => handlePageChange(page)}
        disabled={loading}
        className={`mx-1 ${page === pagination.currentPage ? "bg-blue-500 text-white" : "border-blue-500 text-blue-500"}`}
      >
        {page}
      </Button>
    ));
  };

  const handleOpenProof = () => {
    if (!ticket?.proofUrl) return;
    setProofOpen(true);
  };

  const handleCloseProof = () => {
    setProofOpen(false);
  };

  const handleUpdateStatus = async () => {
    const id = selectedTicketKey;
    if (!id) return;
    if (!status) {
      setError("Select a status.");
      return;
    }

    const payload = {
      status,
      rewardAmount: rewardAmount === "" ? undefined : Number(rewardAmount),
      rewardReason: rewardReason || undefined,
      adminRemarks: adminRemarks || undefined,
    };

    if (payload.rewardAmount !== undefined && Number.isNaN(payload.rewardAmount)) {
      setError("Reward amount must be a number.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      const response = await ApiRequestUtils.update(buildRoute(API_ROUTES.UPDATE_SUPPORT_TICKET_STATUS, id), payload);
      if (response?.success) {
        await fetchTickets();
        setSelectedId("");
        setProofOpen(false);
      } else {
        setError(response?.message || "Failed to update ticket.");
      }
    } catch (err) {
      console.error("Failed to update ticket status:", err);
      setError("Failed to update ticket status.");
    } finally {
      setSaving(false);
    }
  };

  const ticket = selectedRow;
  const booking = ticket?.booking || {};
  const customer = ticket?.customer || {};
  const selectedStatus = String(ticket?.status || status || "UNDER_REVIEW").toUpperCase();
  const showRewardFields = ["UNDER_REVIEW","APPROVED", "REJECTED", "RESOLVED"].includes(selectedStatus);
  const isTerminalTicket = isTerminalStatus(ticket?.status || "");
  const allowedStatusOptions = getAllowedStatusOptions(selectedStatus);

  return (
    <div className="p-2 bg-white rounded-lg shadow-sm">
      <div className="relative overflow-hidden rounded-[30px]">
        <Card className="relative m-2 border border-gray-300 bg-white shadow-sm">
          <CardBody>
            <div className="flex flex-col gap-2 xl:flex-row xl:items-end xl:justify-between">
              <div className="max-w-3xl">
                <Typography variant="h6" className="text-2xl font-semibold text-slate-900">
                  Support Review Reward Management
                </Typography>
              </div>

              <Button
                variant="outlined"
                onClick={handleRefresh}
                disabled={loading || saving}
                className="self-start  bg-red-600 rounded-full px-5 py-3 text-xs font-semibold text-white shadow-sm hover:shadow-md disabled:opacity-60"
              >
                <span className="flex items-center gap-2">
                  {loading ? <Spinner className="h-4 w-4" /> : null}
                  {loading ? "Refreshing..." : "Refresh"}
                </span>
              </Button>
            </div>
            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <Typography className="mb-4 text-sm font-semibold text-slate-700">
                Filter Section
              </Typography>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                <Select
                  label="Status"
                  value={filters.status}
                  onChange={(value) => handleFilterChange("status", value || "")}
                >
                  <Option value="">All</Option>
                  <Option value="OPEN">Open</Option>
                  <Option value="UNDER_REVIEW">Under Review</Option>
                  <Option value="APPROVED">Approved</Option>
                  <Option value="REJECTED">Rejected</Option>
                  <Option value="RESOLVED">Resolved</Option>
                </Select>

                <Select
                  label="Raised By Type"
                  value={filters.raisedByType}
                  onChange={(value) => handleFilterChange("raisedByType", value || "")}
                >
                  <Option value="">All</Option>
                  <Option value="CUSTOMER">Customer</Option>
                  {/* <Option value="DRIVER">Driver</Option> */}
                </Select>

                <Input
                  type="number"
                  label="Booking ID"
                  value={filters.bookingId}
                  onChange={(e) => handleFilterChange("bookingId", e.target.value)}
                />

                <Input
                  type="text"
                  label="Category"
                  value={filters.category}
                  onChange={(e) => handleFilterChange("category", e.target.value)}
                />

                <Input
                  type="date"
                  label="From Date"
                  value={filters.fromDate}
                  onChange={(e) => handleFilterChange("fromDate", e.target.value)}
                />

                <Input
                  type="date"
                  label="To Date"
                  value={filters.toDate}
                  onChange={(e) => handleFilterChange("toDate", e.target.value)}
                />
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <Button
                  onClick={handleApplyFilters}
                  className="rounded-full bg-blue-900 px-5 py-3 text-xs font-semibold text-white shadow-sm hover:shadow-md disabled:opacity-60"
                >
                  Apply Filters
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleClearFilters}
                  className="rounded-full border-slate-300 px-5 py-3 text-xs font-semibold text-slate-700"
                >
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

            <div className="mt-6">
              <div className="overflow-hidden rounded-sm border border-slate-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full  border-collapse">
                    <thead className="bg-primary text-white">
                      <tr className="border-b border-slate-200 bg-slate-900 text-left">
                        <th className="p-2 text-sm font-semibold text-black-100">Action</th>
                        <th className="p-2 text-sm font-semibold text-black-100">Ticket ID</th>
                        <th className="p-2 text-sm font-semibold text-black-100 whitespace-nowrap">Assigned To</th>
                        <th className="p-2 text-sm font-semibold text-black-100">Category</th>
                        <th className="p-2 text-sm font-semibold text-black-100">Description</th>
                        <th className="p-2 text-sm font-semibold text-black-100">Raised By</th>
                        <th className="p-2 text-sm font-semibold text-black-100">Status</th>
                        <th className="p-2 text-sm font-semibold text-black-100">Reward</th>
                        {/* <th className="p-2 text-sm font-semibold text-black-100">Reward Reason</th>
                        <th className="p-2 text-sm font-semibold text-black-100">Admin Remarks</th> */}
                        <th className="p-2 text-sm font-semibold text-black-100">Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((item, index) => {
                        const id = item?.ticketId || item?.id;
                        const isSelected = String(id) === String(selectedId);
                        return (
                          <tr
                            key={`${id || "row"}-${index}`}
                            className={`border-b border-slate-100 align-top transition ${isSelected ? "bg-sky-50" : "hover:bg-slate-50"
                              }`}
                          >
                            <td className="p-3 text-sm whitespace-nowrap">
                              <Button
                                size="sm"
                                onClick={() => handleSelectTicket(item)}
                                className="rounded-full bg-gradient-to-r from-sky-600 to-cyan-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:shadow-md"
                              >
                                Review
                              </Button>
                            </td>
                            <td className="p-3 text-sm whitespace-nowrap">
                              <div className="font-semibold text-black-950">{item?.ticketId || "-"}</div>
                              {/* <div className="text-xs text-black-600">#{item?.id ?? "-"}</div> */}
                            </td>
                            <td className="p-3 text-sm whitespace-nowrap">
                              <div className="font-semibold text-black-950">{item?.statusChangedByUser?.name || "-"}</div>
                            </td>
                            <td className="p-3 text-sm whitespace-nowrap">
                              <div className="font-medium text-black-950">{item?.category || "-"}</div>
                            </td>
                            <td className="p-3 text-sm whitespace-nowrap">
                              <div className="max-w-[280px] text-xs leading-5 text-black-700">
                                {item?.description || "-"}
                              </div>
                            </td>
                            <td className="p-3 text-sm whitespace-nowrap">
                              <div className='inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold shadow-sm'>
                                {formatBadgeText(item?.raisedByType) || "-"}
                              </div>
                              {/* <div className="mt-1 text-xs text-black-700">{item?.customerId || item?.driverId || "-"}</div> */}
                            </td>
                            <td className="p-3 text-sm whitespace-nowrap">
                              <div className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold shadow-sm ${getStatusTone(item?.status)}`}>
                                {formatBadgeText(item?.status) || "-"}
                              </div>
                            </td>
                            <td className="p-3 text-sm whitespace-nowrap">
                              <div className="font-medium text-black-950">{formatCurrency(item?.rewardAmount)}</div>
                            </td>                            
                            <td className="p-3 text-sm whitespace-nowrap text-black-700">{formatDateTime(item?.created_at || item?.createdAt)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
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
            <div className="mt-2 overflow-hidden rounded-[12px] border border-slate-200 bg-white shadow-sm">
              <div ref={ticketReviewRef} className="border-b border-slate-200 bg-gradient-to-r from-slate-900 to-slate-700 px-5 py-4 text-white">
                <Typography variant="h6" className="text-black">
                  Ticket Review
                </Typography>
                <Typography className="mt-1 text-sm text-black">
                  Selected ticket details and update controls
                </Typography>
              </div>
              <div className="p-5">
                {ticket ? (
                  <div className="space-y-3">
                    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-slate-50">
                      <table className="w-full border-collapse text-sm">
                        <tbody>
                          <tr className="border-b border-slate-200 bg-primary text-white">
                            <th className="w-40 bg-slate-100 px-4 py-3 text-left font-semibold text-slate-700">Ticket ID</th>
                            <th className="w-40 bg-slate-100 px-4 py-3 text-left font-semibold text-slate-700">Category</th>
                            <th className="w-40 bg-slate-100 px-4 py-3 text-left font-semibold text-slate-700">Booking ID</th>
                            <th className="w-40 bg-slate-100 px-4 py-3 text-left font-semibold text-slate-700">Customer</th>
                            <th className="w-40 bg-slate-100 px-4 py-3 text-left font-semibold text-slate-700 whitespace-nowrap">Disputed Amount</th>
                            <th className="w-40 bg-slate-100 px-4 py-3 text-left font-semibold text-slate-700">Proof</th>
                          </tr>
                          <tr className="border-b border-slate-200">
                            <td className="px-4 py-3 text-slate-900">{ticket?.ticketId || "-"}</td>
                            <td className="px-4 py-3 text-slate-900 whitespace-nowrap">{ticket?.category || "-"}</td>
                            <td className="px-4 py-3 text-slate-900">{booking?.bookingNumber || "-"}</td>
                            <td className="px-4 py-3 text-slate-900">{customer?.firstName || customer?.name || "-"}</td>
                            <td className="px-4 py-3 text-slate-900">{formatCurrency(ticket?.disputedAmount)}</td>
                            <td className="px-4 py-3 text-slate-900">{ticket?.proofUrl ? "Available" : "Not provided"}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <div className="space-y-2">
                        <Typography className="text-sm font-semibold text-black">
                          Status
                        </Typography>
                        <Select
                          value={selectedStatus}
                          label="Status"
                          selected={(element) => element?.props?.children || formatBadgeText(selectedStatus)}
                          onChange={(value) => setStatus(value || "UNDER_REVIEW")}
                          disabled={isTerminalTicket}
                        >
                          {allowedStatusOptions.map((option) => (
                            <Option key={option} value={option}>
                              {formatBadgeText(option)}
                            </Option>
                          ))}
                        </Select>
                      </div>

                      {showRewardFields ? (
                        <>
                          <div className="space-y-2">
                            <Typography className="text-sm font-semibold text-black">
                              Reward Amount
                            </Typography>
                            <Input
                              type="number"
                              value={rewardAmount}
                              onChange={(e) => setRewardAmount(e.target.value)}
                              disabled={isTerminalTicket}
                              className="!border-slate-300 !text-black placeholder:!text-black/40"
                            />
                          </div>

                          <div className="space-y-2">
                            <Typography className="text-sm font-semibold text-black">
                              Reward Reason
                            </Typography>
                            <Textarea
                              value={rewardReason}
                              onChange={(e) => setRewardReason(e.target.value)}
                              disabled={isTerminalTicket}
                              className="!border-slate-300 !text-black placeholder:!text-black/40"
                            />
                          </div>

                          <div className="space-y-2">
                            <Typography className="text-sm font-semibold text-black">
                              Admin Remarks
                            </Typography>
                            <Textarea
                              value={adminRemarks}
                              onChange={(e) => setAdminRemarks(e.target.value)}
                              disabled={isTerminalTicket}
                              className="!border-slate-300 !text-black placeholder:!text-black/40"
                            />
                          </div>
                        </>
                      ) : null}

                    </div>
                    {ticket?.proofUrl ? (
                      <Button
                        variant="outlined"
                        onClick={handleOpenProof}
                        className="w-full rounded-full border-slate-300 px-4 py-3 text-xs font-bold uppercase tracking-wide text-black"
                      >
                        Open proof attachment
                      </Button>
                    ) : null}

                    <Button
                      onClick={handleUpdateStatus}
                      disabled={saving}
                      className="w-full rounded-full bg-gradient-to-r from-slate-900 to-slate-700 px-4 py-3 text-xs font-bold uppercase tracking-wide text-white shadow-none disabled:opacity-60"
                    >
                      {saving ? "Saving..." : "Update Status"}
                    </Button>
                  </div>
                ) : (
                  <Typography className="mt-4 text-sm text-black">
                    Select a ticket to inspect details and update its workflow status.
                  </Typography>
                )}
              </div>
            </div>

            <Dialog open={proofOpen} handler={handleCloseProof} size="lg">
              <DialogHeader className="flex items-center justify-between">
                <span>Proof Attachment</span>
                <div className="flex items-center gap-2">
                  {ticket?.proofUrl ? (
                    <a href={ticket.proofUrl} download target="_blank" rel="noreferrer">
                      <Button
                        size="sm"
                        className="rounded-full bg-blue-900 px-4 py-2 text-xs font-semibold text-white shadow-none"
                      >
                        Download
                      </Button>
                    </a>
                  ) : null}
                  <Button
                    size="sm"
                    variant="outlined"
                    onClick={handleCloseProof}
                    className="rounded-full border-slate-300 bg-red-500 px-4 py-2 text-xs font-semibold text-white"
                  >
                    Close
                  </Button>
                </div>
              </DialogHeader>
              <DialogBody className="space-y-3">
                {ticket?.proofUrl ? (
                  <DocumentPreview
                    src={ticket.proofUrl}
                  />
                ) : null}
              </DialogBody>
            </Dialog>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

export default SupportReviewRewardManagement;
