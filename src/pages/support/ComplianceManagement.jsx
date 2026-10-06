import React, { useEffect, useRef, useState } from "react";
import { Button, Card, CardBody, Dialog, DialogBody, DialogFooter, DialogHeader, Spinner, Typography } from "@material-tailwind/react";
import moment from "moment";
import { ApiRequestUtils } from "@/utils/apiRequestUtils";
import { API_ROUTES } from "@/utils/constants";
import { safeText } from "@/utils/text";
import ComplianceStartReviewModal from "./components/ComplianceStartReviewModal";
import ComplianceHistoryModal from "./components/ComplianceHistoryModal";

const PAGE_LIMIT = 20;
const STATUS_OPTIONS = ["", "OPEN", "IN_PROGRESS", "CLOSED"];

const getPayload = (response) => response?.data ?? response ?? {};

const getRows = (response) => {
  const payload = getPayload(response);
  if (Array.isArray(payload)) return payload;
  const rows = payload?.rows || payload?.items || payload?.escalations || payload?.results || payload?.list || payload?.data;
  if (Array.isArray(rows)) return rows;
  if (Array.isArray(rows?.rows)) return rows.rows;
  if (Array.isArray(rows?.items)) return rows.items;
  if (Array.isArray(rows?.escalations)) return rows.escalations;
  if (Array.isArray(rows?.results)) return rows.results;
  if (Array.isArray(rows?.list)) return rows.list;
  return [];
};

const getStatusClass = (status) => {
  switch (String(status || "").toUpperCase()) {
    case "OPEN":
      return "bg-red-100 text-red-700";
    case "IN_PROGRESS":
      return "bg-amber-100 text-amber-800";
    case "CLOSED":
      return "bg-green-100 text-green-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

const formatStatus = (status) => String(status || "-").replace(/_/g, " ");
const formatDate = (value) => value ? moment(value).format("DD-MM-YYYY hh:mm A") : "-";

function ComplianceManagement() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({ status: "" });
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalItems: 0 });
  const [activeCount, setActiveCount] = useState(0);
  const [closeRow, setCloseRow] = useState(null);
  const [startRow, setStartRow] = useState(null);
  const [startModalMode, setStartModalMode] = useState("start");
  const [historyRow, setHistoryRow] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [closureNotes, setClosureNotes] = useState("");
  const historyRequestRef = useRef(0);
  const reviewRequestRef = useRef(0);

  const fetchActiveCount = async () => {
    try {
      const response = await ApiRequestUtils.get(API_ROUTES.COMPLIANCE_ESCALATIONS_ACTIVE_COUNT);
      const payload = getPayload(response);
      setActiveCount(Number(payload?.activeCount ?? payload?.count ?? payload?.data?.activeCount ?? 0));
    } catch (err) {
      console.error("Failed to fetch compliance active count:", err);
    }
  };

  const fetchEscalations = async (page = 1, nextFilters = filters) => {
    setLoading(true);
    setError("");
    try {
      const query = Object.fromEntries(
        Object.entries(nextFilters).filter(([, value]) => value !== "" && value !== null && value !== undefined)
      );
      query.page = page;
      query.limit = PAGE_LIMIT;

      const response = await ApiRequestUtils.getWithQueryParam(API_ROUTES.COMPLIANCE_ESCALATIONS_LIST, query);
      const nextRows = getRows(response);
      const payload = getPayload(response);
      const meta = response?.pagination || response?.meta || payload?.pagination || payload?.meta || {};
      const totalItems = Number(meta?.totalItems ?? meta?.total ?? meta?.count ?? payload?.totalItems ?? nextRows.length);
      const totalPages = Number(meta?.totalPages ?? (totalItems ? Math.ceil(totalItems / PAGE_LIMIT) : 1));

      setRows(Array.isArray(nextRows) ? nextRows : []);
      setPagination({ currentPage: page, totalPages: Math.max(totalPages, 1), totalItems });
      if (!nextRows.length) setError("No compliance escalations found.");
    } catch (err) {
      console.error("Failed to fetch compliance escalations:", err);
      setRows([]);
      setError("Failed to fetch compliance escalations.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEscalations(1);
    fetchActiveCount();
  }, []);

  const handleApply = () => fetchEscalations(1, filters);

  const handleClear = () => {
    const resetFilters = { status: "" };
    setFilters(resetFilters);
    fetchEscalations(1, resetFilters);
  };

  const fetchEscalationDetails = async (row) => {
    const escalationId = row?.escalationId || row?.id;
    if (!escalationId) return row;
    try {
      const response = await ApiRequestUtils.get(
        API_ROUTES.COMPLIANCE_ESCALATION_DETAILS + "/" + encodeURIComponent(escalationId)
      );
      if (!response?.success) return row;
      const payload = getPayload(response);
      const details = payload?.escalation || payload?.data || payload;
      return details && typeof details === "object" ? details : row;
    } catch (err) {
      console.error("Failed to fetch compliance escalation details:", err);
      return row;
    }
  };

  const handleOpenReview = async (row) => {
    const requestId = reviewRequestRef.current + 1;
    reviewRequestRef.current = requestId;
    setStartModalMode("review");
    setStartRow(row);
    const details = await fetchEscalationDetails(row);
    if (reviewRequestRef.current === requestId) {
      setStartRow(details);
    }
  };

  const handleOpenHistory = async (row) => {
    const requestId = historyRequestRef.current + 1;
    historyRequestRef.current = requestId;
    setHistoryLoading(true);
    setHistoryRow(row);
    const details = await fetchEscalationDetails(row);
    if (historyRequestRef.current === requestId) {
      setHistoryRow(details);
      setHistoryLoading(false);
    }
  };

  const handlePageChange = (page) => {
    if (page < 1 || page > pagination.totalPages || loading) return;
    setPagination((prev) => ({ ...prev, currentPage: page }));
    fetchEscalations(page);
  };

  const updateStatus = async (row, status, payload) => {
    const escalationId = row?.escalationId || row?.id;
    if (!escalationId) return;

    setSaving(true);
    try {
      const response = await ApiRequestUtils.update(
        `${API_ROUTES.COMPLIANCE_ESCALATIONS_STATUS}/${encodeURIComponent(escalationId)}/status`,
        { status, ...payload }
      );
      if (!response?.success) {
        setError(response?.message || "Failed to update escalation status.");
        return;
      }
      setCloseRow(null);
      setStartRow(null);
      setClosureNotes("");
      await Promise.all([fetchEscalations(pagination.currentPage), fetchActiveCount()]);
    } catch (err) {
      console.error("Failed to update compliance escalation:", err);
      setError("Failed to update escalation status.");
    } finally {
      setSaving(false);
    }
  };

  const renderPageButtons = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, pagination.currentPage - Math.floor(maxVisible / 2));
    const end = Math.min(pagination.totalPages, start + maxVisible - 1);
    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }
    for (let page = start; page <= end; page += 1) pages.push(page);

    return pages.map((page) => (
      <Button
        key={page}
        size="sm"
        variant={page === pagination.currentPage ? "filled" : "outlined"}
        className={page === pagination.currentPage ? "bg-blue-600 text-white" : "border-blue-600 text-blue-600"}
        disabled={loading}
        onClick={() => handlePageChange(page)}
      >
        {page}
      </Button>
    ));
  };

  return (
    <div className="mt-2 flex flex-col gap-6 bg-white">
      <div className="p-4">
        <Typography variant="h4" color="blue-gray">Compliance Management</Typography>
        <Typography className="mt-1 font-normal text-blue-gray-600">
          Review and resolve customer feedback escalations.
        </Typography>
      </div>
      <Card className="mx-4 overflow-hidden">
        <CardBody className="p-4">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 text-sm font-semibold text-blue-gray-700">
              <span>Active Escalations</span>
              <span className="rounded-full bg-red-100 px-3 py-1 text-red-700">{activeCount}</span>
              <span className="text-xs font-normal text-blue-gray-500">OPEN + IN PROGRESS</span>
            </div>
            <Button
              size="sm"
              className="bg-blue-600 text-white hover:bg-blue-700"
              onClick={() => Promise.all([fetchEscalations(pagination.currentPage), fetchActiveCount()])}
            >
              Refresh
            </Button>
          </div>

          <div className="mb-5 grid grid-cols-1 items-end gap-3 md:grid-cols-[180px_220px_1fr]">
            <div>
              <label htmlFor="compliance-status" className="mb-1 block text-xs font-semibold text-blue-gray-600">Status</label>
              <select
                id="compliance-status"
                value={filters.status}
                onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))}
                className="w-full rounded-md border border-blue-gray-200 bg-white px-3 py-2 text-sm"
              >
                {STATUS_OPTIONS.map((status) => <option key={status} value={status}>{status ? formatStatus(status) : "All Statuses"}</option>)}
              </select>
            </div>
            <div className="flex gap-3 md:justify-end">
              <Button className="bg-green-600 text-white hover:bg-green-700" onClick={handleApply} disabled={loading}>Apply</Button>
              <Button className="bg-gray-500 text-white hover:bg-gray-600" onClick={handleClear} disabled={loading}>Clear</Button>
            </div>
          </div>

          {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] table-auto bg-white text-left">
              <thead className="whitespace-nowrap">
                <tr className="border-y border-blue-700 bg-blue-600 text-white">
                  {['Escalation Id','Booking ID', 'Status', 'Action', 'Assigned By', 'Created Date', 'Actions'].map((heading) => (
                    <th key={heading} className="whitespace-nowrap px-4 py-3 text-xs font-bold uppercase text-white">{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="whitespace-nowrap bg-white">
                {loading ? (
                  <tr><td colSpan="6" className="whitespace-nowrap py-10 text-center"><Spinner className="mx-auto h-7 w-7" /></td></tr>
                ) : rows.length ? rows.map((row, index) => {
                  const status = String(row?.status || "").toUpperCase();
                  const escalationId = row?.escalationId || row?.id || "-";
                  return (
                    <tr key={escalationId || index} className="border-b border-blue-gray-50 hover:bg-blue-gray-50/30">
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-blue-gray-700 font-bold">{safeText(row?.escalationId)}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-blue-gray-700">{safeText(row?.bookingId)}</td>
                      <td className="whitespace-nowrap px-4 py-3"><span className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(status)}`}>{formatStatus(status)}</span></td>
                      <td className="max-w-[240px] truncate whitespace-nowrap px-4 py-3 text-sm text-blue-gray-700" title={safeText(row?.action)}>{safeText(row?.action)}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-blue-gray-700">{safeText(row?.assignedByUser?.name || row?.assignedBy)}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-blue-gray-700">{formatDate(row?.createdAt || row?.created_at)}</td>
                      <td className="whitespace-nowrap px-4 py-3">
                        {status === "OPEN" && <Button size="sm" className="bg-blue-600" disabled={saving} onClick={() => { setStartModalMode("start"); setStartRow(row); }}>Start Work</Button>}
                        {status === "IN_PROGRESS" && (
                          <div className="flex gap-2">
                            <Button size="sm" variant="outlined" className="border-blue-600 text-blue-600" disabled={saving} onClick={() => handleOpenReview(row)}>Review</Button>
                            <Button size="sm" className="bg-green-600" disabled={saving} onClick={() => { setCloseRow(row); setClosureNotes(""); }}>Close</Button>
                          </div>
                        )}
                        {status === "CLOSED" && <Button size="sm" variant="outlined" className="border-blue-600 text-blue-600" onClick={() => handleOpenHistory(row)}>History</Button>}
                      </td>
                    </tr>
                  );
                }) : (
                  <tr><td colSpan="6" className="whitespace-nowrap py-10 text-center text-sm text-blue-gray-500">No compliance escalations found.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex flex-col items-center">
            <div className="flex items-center justify-center">
              <Button
                size="sm"
                variant="text"
                disabled={pagination.currentPage <= 1 || loading}
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                className="mx-1"
              >
                {"<"}
              </Button>
              {renderPageButtons()}
              <Button
                size="sm"
                variant="text"
                disabled={pagination.currentPage >= pagination.totalPages || loading}
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                className="mx-1"
              >
                {">"}
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      <ComplianceStartReviewModal
        open={Boolean(startRow)}
        row={startRow}
        mode={startModalMode}
        saving={saving}
        onClose={() => {
          reviewRequestRef.current += 1;
          setStartRow(null);
        }}
        onStart={() => updateStatus(startRow, "IN_PROGRESS", { action: "Compliance team started review" })}
      />

      <Dialog open={Boolean(closeRow)} handler={() => setCloseRow(null)} size="sm">
        <DialogHeader>Close Compliance Escalation</DialogHeader>
        <DialogBody divider>
          <label htmlFor="closure-notes" className="mb-2 block text-sm font-semibold text-blue-gray-700">Closure Notes *</label>
          <textarea
            id="closure-notes"
            value={closureNotes}
            onChange={(event) => setClosureNotes(event.target.value)}
            placeholder="Enter resolution notes"
            className="min-h-[120px] w-full rounded-md border border-blue-gray-200 p-3 text-sm outline-none focus:border-blue-500"
          />
        </DialogBody>
        <DialogFooter className="gap-2">
          <Button variant="text" onClick={() => setCloseRow(null)} disabled={saving}>Cancel</Button>
          <Button
            className="bg-green-600"
            disabled={saving || !closureNotes.trim()}
            onClick={() => updateStatus(closeRow, "CLOSED", { closureNotes: closureNotes.trim(), action: "Closed after resolution" })}
          >
            Close Escalation
          </Button>
        </DialogFooter>
      </Dialog>

      <ComplianceHistoryModal
        open={Boolean(historyRow)}
        row={historyRow}
        loading={historyLoading}
        onClose={() => {
          historyRequestRef.current += 1;
          setHistoryLoading(false);
          setHistoryRow(null);
        }}
      />
    </div>
  );
}

export default ComplianceManagement;