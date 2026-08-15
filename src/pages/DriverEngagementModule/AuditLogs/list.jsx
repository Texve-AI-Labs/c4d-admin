import React, { useEffect, useMemo, useRef, useState } from "react";
import { Typography } from "@material-tailwind/react";
import AuditSummaryCards from "./AuditSummaryCards";
import AuditLogsTable from "./AuditLogsTable";
import {
  fetchDriverEngagementAuditActionView,
  fetchDriverEngagementAuditLogs,
  fetchDriverEngagementAuditSummary,
} from "./auditLogApi";
import { buildAuditSummary, mapAuditRows } from "./auditLogMapper";

const resolvePartnerId = (source = {}, partnerType = "CAB") => {
  const normalizedType = String(partnerType || "").toUpperCase();
  if (normalizedType === "AUTO") {
    return source.autoId || source.autoPartnerId || source.partnerId || source.partner?.id || source.partner?._id;
  }
  if (normalizedType === "DRIVER") {
    return source.driverId || source.partnerId || source.partner?.id || source.partner?._id;
  }
  return source.cabId || source.cabPartnerId || source.partnerId || source.partner?.id || source.partner?._id;
};

const extractAuditRows = (response) => {
  if (Array.isArray(response?.rows)) return response.rows;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.rows)) return response.data.rows;
  if (Array.isArray(response?.data?.data?.rows)) return response.data.data.rows;
  if (Array.isArray(response?.data?.data)) return response.data.data;
  return [];
};

function DriverEngagementAuditLogs() {
  const [rows, setRows] = useState([]);
  const [summaryPayload, setSummaryPayload] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: null,
  });
  const [loading, setLoading] = useState(true);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewError, setViewError] = useState("");
  const [viewPayload, setViewPayload] = useState(null);
  const [expandedRowId, setExpandedRowId] = useState(null);
  const viewRequestSeq = useRef(0);

  useEffect(() => {
    const loadAuditLogs = async () => {
      setLoading(true);
      try {
        const [response, summaryResponse] = await Promise.all([
          fetchDriverEngagementAuditLogs({
            page: pagination.currentPage,
            limit: pagination.itemsPerPage,
            partnerType: "CAB",
          }),
          fetchDriverEngagementAuditSummary({ partnerType: "CAB" }),
        ]);

        const auditRows = extractAuditRows(response);
        const mappedRows = mapAuditRows(auditRows);
        const nextPagination = response?.pagination || {};
        const summaryData = summaryResponse?.data || summaryResponse?.summary || summaryResponse?.data?.summary || null;

        setRows(mappedRows);
        setSummaryPayload(summaryData);
        setPagination((prev) => ({
          ...prev,
          currentPage: Number(nextPagination.currentPage || prev.currentPage || 1),
          totalPages: Number(nextPagination.totalPages || 1),
          totalItems: Number(nextPagination.totalItems || mappedRows.length),
          itemsPerPage: Number(nextPagination.itemsPerPage || prev.itemsPerPage || 10),
        }));
      } catch (error) {
        console.error("Failed to fetch audit logs:", error);
        setRows([]);
        setSummaryPayload(null);
      } finally {
        setLoading(false);
      }
    };

    loadAuditLogs();
  }, [pagination.currentPage, pagination.itemsPerPage]);

  const summary = useMemo(() => buildAuditSummary(rows, summaryPayload), [rows, summaryPayload]);

  const onPageChange = (nextPage) => {
    setPagination((prev) => ({
      ...prev,
      currentPage: Math.max(1, Math.min(nextPage, prev.totalPages || 1)),
    }));
  };

  const onView = async (row) => {
    const nextExpandedRowId = expandedRowId === row.id ? null : row.id;
    const requestSeq = ++viewRequestSeq.current;
    setExpandedRowId(nextExpandedRowId);
    setViewLoading(Boolean(nextExpandedRowId));
    setViewError("");
    setViewPayload(row?.raw || null);

    if (nextExpandedRowId === null) {
      setViewLoading(false);
      return;
    }

    try {
      const source = row?.raw || {};
      const partnerType = source.partnerType || "CAB";
      const partnerId = resolvePartnerId(source, partnerType);
      const response = await fetchDriverEngagementAuditActionView({
        partnerType,
        partnerId,
        limit: 20,
        offset: 0,
      });

      const records = Array.isArray(response?.rows)
        ? response.rows
        : Array.isArray(response?.data)
          ? response.data
          : [];

      if (requestSeq !== viewRequestSeq.current) return;

      setViewPayload({
        selectedRow: source,
        relatedHistory: records,
      });
    } catch (error) {
      if (requestSeq !== viewRequestSeq.current) return;
      setViewError(error?.message || "Failed to load audit details");
    } finally {
      if (requestSeq !== viewRequestSeq.current) return;
      setViewLoading(false);
    }
  };

  return (
    <div className="mt-5 mb-10 space-y-4 px-4 bg-white p-2 shadow-sm">
      <div>
        <Typography variant="h5" color="blue-gray" className="font-bold">Audit Logs</Typography>
        <Typography color="gray" className="mt-1 text-base font-normal">Track automated tier upgrades and downgrades</Typography>
      </div>

      <AuditSummaryCards summary={summary} />

      <AuditLogsTable
        rows={rows}
        loading={loading}
        pagination={pagination}
        onPageChange={onPageChange}
        onView={onView}
        expandedRowId={expandedRowId}
        expandedRowPayload={viewPayload}
        expandedRowLoading={viewLoading}
        expandedRowError={viewError}
      />
    </div>
  );
}

export default DriverEngagementAuditLogs;
