import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button, Card, CardBody, Dialog, DialogBody, DialogHeader, Spinner, Typography } from "@material-tailwind/react";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { API_ROUTES } from "@/utils/constants";
import SupportTicketFilters from "./components/SupportTicketFilters";
import SupportTicketTable from "./components/SupportTicketTable";
import SupportTicketDetails from "./components/SupportTicketDetails";
import {formatBadgeText,formatCurrency,formatDateTime,getAllowedStatusOptions,getStatusTone,isTerminalStatus,buildRoute,normalizeRows,validateTicketReview} from "./supportTicketReviewUtils";
import DocumentPreview from "./components/DocumentPreview";
import ConfirmBooking from "@/pages/booking/confirmBooking";

function SupportReviewRewardManagement() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 20,
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
  const [fieldErrors, setFieldErrors] = useState({});
  const [proofOpen, setProofOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [bookingModalData, setBookingModalData] = useState(null);
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
    setReviewOpen(true);
    requestAnimationFrame(() => {
      ticketReviewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const handleOpenBookingModal = (item) => {
    const id = item?.ticketId || item?.id;
    if (!id) return;
    setSelectedId(id);
    setBookingModalData(
      item?.booking
        ? {
            ...item.booking,
            id: item?.booking?.id || item?.bookingId || item?.booking?.bookingId,
            bookingId: item?.booking?.id || item?.bookingId || item?.booking?.bookingId,
            customerId: item?.customer?.id || item?.customerId || item?.booking?.customerId,
          }
        : {
            id: item?.bookingId || item?.booking?.id || "",
            bookingId: item?.bookingId || item?.booking?.id || "",
            customerId: item?.customer?.id || item?.customerId || "",
            serviceType: item?.booking?.serviceType || "",
          }
    );
    setIsOpen(true);
  };

  const handleRefresh = async () => {
    setError("");
    setSelectedId("");
    setReviewOpen(false);
    setProofOpen(false);
    setFieldErrors({});
    await fetchTickets(pagination.currentPage);
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleApplyFilters = async () => {
    setSelectedId("");
    setReviewOpen(false);
    setProofOpen(false);
    setFieldErrors({});
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
    setReviewOpen(false);
    setProofOpen(false);
    setFieldErrors({});
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
        onClick={(e) => {
          e.stopPropagation();
          handlePageChange(page);
        }}
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

  const handleCloseReview = async () => {
    setReviewOpen(false);
    setProofOpen(false);
    setSelectedId("");
    setFieldErrors({});
    await fetchTickets(pagination.currentPage);
  };

  const handleUpdateStatus = async () => {
    const id = selectedTicketKey;
    if (!id) return;
    const validation = validateTicketReview({
      selectedStatus,
      rewardAmount,
      rewardReason,
      adminRemarks,
    });
    setFieldErrors(validation.errors);
    if (!validation.valid) {
      return;
    }

    const payload = {
      status,
      rewardAmount: rewardAmount === "" ? undefined : Number(rewardAmount),
      rewardReason: rewardReason || undefined,
      adminRemarks: adminRemarks || undefined,
    };

    try {
      setSaving(true);
      setError("");
      const response = await ApiRequestUtils.update(buildRoute(API_ROUTES.UPDATE_SUPPORT_TICKET_STATUS, id), payload);
      if (response?.success) {
        await fetchTickets();
        setSelectedId("");
        setReviewOpen(false);
        setProofOpen(false);
        setFieldErrors({});
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
  const ticketStatus = String(ticket?.status || "").toUpperCase();
  const selectedStatus = String(status || ticketStatus || "UNDER_REVIEW").toUpperCase();
  const isTerminalTicket = isTerminalStatus(ticket?.status || "");
  const allowedStatusOptions = getAllowedStatusOptions(selectedStatus);

  const setFieldValue = (key, value) => {
    if (key === "status") setStatus(value);
    if (key === "rewardAmount") setRewardAmount(value);
    if (key === "rewardReason") setRewardReason(value);
    if (key === "adminRemarks") setAdminRemarks(value);
  };

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
            <SupportTicketFilters
              filters={filters}
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

            <div className="mt-6">
                <SupportTicketTable
                  rows={rows}
                  selectedId={selectedId}
                  onSelectTicket={handleSelectTicket}
                  onOpenBooking={handleOpenBookingModal}
                  formatBadgeText={formatBadgeText}
                  getStatusTone={getStatusTone}
                  formatCurrency={formatCurrency}
                  formatDateTime={formatDateTime}
                />

              <div className="mt-4 flex items-center justify-center">
                  <Button
                    size="sm"
                    variant="outlined"
                    disabled={pagination.currentPage === 1 || loading}
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePageChange(pagination.currentPage - 1);
                    }}
                    className="mx-1"
                  >
                    {"<"}
                  </Button>
                  {renderPageButtons()}
                  <Button
                    size="sm"
                    variant="outlined"
                    disabled={pagination.currentPage === pagination.totalPages || loading}
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePageChange(pagination.currentPage + 1);
                    }}
                    className="mx-1"
                  >
                    {">"}
                  </Button>
                </div>
              </div>

            <Dialog
              open={reviewOpen}
              handler={handleCloseReview}
              size="lg"
              className="max-h-[90vh] overflow-y-auto"
              dismiss={{ outsidePress: false, escapeKey: false }}
            >
              <DialogHeader className="flex items-center justify-between">
                <span className="text-lg">Ticket Review</span>
                <Button size="sm" variant="outlined" onClick={handleCloseReview} className="rounded-full border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700">
                  Close
                </Button>
              </DialogHeader>
              <DialogBody className="space-y-3">
              <div ref={ticketReviewRef}>
      <SupportTicketDetails
                ticket={ticket}
                booking={booking}
                customer={customer}
                selectedStatus={selectedStatus}
                allowedStatusOptions={allowedStatusOptions}
                rewardAmount={rewardAmount}
                rewardReason={rewardReason}
                adminRemarks={adminRemarks}
                fieldErrors={fieldErrors}
                isTerminalTicket={isTerminalTicket}
                onStatusChange={(value) => setFieldValue("status", value)}
                onRewardAmountChange={(value) => setFieldValue("rewardAmount", value)}
                onRewardReasonChange={(value) => setFieldValue("rewardReason", value)}
                onAdminRemarksChange={(value) => setFieldValue("adminRemarks", value)}
                onOpenProof={handleOpenProof}
                onUpdateStatus={handleUpdateStatus}
                saving={saving}
              />
              </div>
            </DialogBody>
            </Dialog>

            <Dialog open={proofOpen} handler={handleCloseProof} size="md" className="z-[9999]">
              <DialogHeader className="flex items-center justify-between py-3">
                <span className="text-base font-semibold">Proof Attachment</span>
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
              <DialogBody className="space-y-2 pt-0">
                {ticket?.proofUrl ? (
                  <DocumentPreview src={ticket.proofUrl} />
                ) : null}
              </DialogBody>
            </Dialog>
            <Dialog open={isOpen} size="xl" className="max-w-6xl w-[95vw]">
                            <DialogHeader className="flex justify-end items-end">
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="text-gray-500 hover:text-black text-xl font-bold focus:outline-none"
                                >
                                    ×
                                </button>
                            </DialogHeader>
                            <DialogBody className="max-h-[80vh] overflow-y-auto">
                                {bookingModalData ? (
                                  <ConfirmBooking
                                    bookingData={bookingModalData}
                                    setIsOpen={setIsOpen}
                                    onConfirm={() => {
                                      setIsOpen(false);
                                      setBookingModalData(null);
                                    }}
                                    hideBackButton={true}
                                  />
                                ) : (
                                  <Typography className="p-4 text-sm text-slate-600">Loading booking details...</Typography>
                                )}
                            </DialogBody>
                        </Dialog>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

export default SupportReviewRewardManagement;