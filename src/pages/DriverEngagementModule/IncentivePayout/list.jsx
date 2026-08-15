import React, { useEffect, useMemo, useRef, useState } from "react";
import { Typography } from "@material-tailwind/react";
import IncentiveSummaryCards from "./IncentiveSummaryCards";
import IncentiveStatusTabs from "./IncentiveStatusTabs";
import IncentivePayoutTable from "./IncentivePayoutTable";
import {
  fetchIncentivePayoutActionView,
  fetchIncentivePayoutData,
  fetchIncentivePayoutSummary,
} from "./incentivePayoutApi";
import { buildPayoutSummary, mapPayoutRows } from "./incentivePayoutMapper";
import ActionViewModal from "../common/ActionViewModal";

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

const extractPayoutRows = (response) => {
  if (Array.isArray(response?.rows)) return response.rows;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.rows)) return response.data.rows;
  if (Array.isArray(response?.data?.data?.rows)) return response.data.data.rows;
  if (Array.isArray(response?.data?.data)) return response.data.data;
  return [];
};

function IncentivePayoutList() {
  const [status, setStatus] = useState("ALL");
  const [rows, setRows] = useState([]);
  const [summaryPayload, setSummaryPayload] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: null,
  });
  const [loading, setLoading] = useState(true);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewError, setViewError] = useState("");
  const [viewPayload, setViewPayload] = useState(null);
  const viewRequestSeq = useRef(0);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [response, summaryResponse] = await Promise.all([
          fetchIncentivePayoutData({
            page: pagination.currentPage,
            limit: pagination.itemsPerPage,
            status,
          }),
          fetchIncentivePayoutSummary({}),
        ]);

        const payoutRows = extractPayoutRows(response);
        const mappedRows = mapPayoutRows(payoutRows);
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
        console.error("Failed to fetch incentive payout list:", error);
        setRows([]);
        setSummaryPayload(null);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [status, pagination.currentPage, pagination.itemsPerPage]);

  const summary = useMemo(() => buildPayoutSummary(rows, summaryPayload), [rows, summaryPayload]);

  const onStatusChange = (value) => {
    setStatus(value);
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const onPageChange = (nextPage) => {
    setPagination((prev) => ({
      ...prev,
      currentPage: Math.max(1, Math.min(nextPage, prev.totalPages || 1)),
    }));
  };

  const onView = async (row) => {
    setIsViewOpen(true);
    setViewLoading(true);
    setViewError("");
    setViewPayload(row?.raw || null);
    const requestSeq = ++viewRequestSeq.current;

    try {
      const source = row?.raw || {};
      const partnerType = source.partnerType || "CAB";
      const partnerId = resolvePartnerId(source, partnerType);
      const response = await fetchIncentivePayoutActionView({
        partnerType,
        status: row?.status,
        partnerId,
        requestId: source.requestId || source._id || source.id,
        limit: 20,
        offset: 0,
      });

      const records = Array.isArray(response?.rows)
        ? response.rows
        : Array.isArray(response?.data)
          ? response.data
          : [];
      const selectedRecord =
        records.find((item) =>
          String(item?._id || item?.id || item?.requestId || "") === String(source._id || source.id || source.requestId || "")
        ) || source;

      if (requestSeq !== viewRequestSeq.current) return;

      setViewPayload({
        selectedRow: source,
        fetchedRecord: selectedRecord,
        fetchedList: records,
      });
    } catch (error) {
      if (requestSeq !== viewRequestSeq.current) return;
      setViewError(error?.message || "Failed to load incentive details");
    } finally {
      if (requestSeq !== viewRequestSeq.current) return;
      setViewLoading(false);
    }
  };

  return (
    <div className="mt-5 mb-10 space-y-4 px-4 bg-white p-2 shadow-sm">
      <div>
        <Typography variant="h5" color="blue-gray" className="font-bold">
          Incentive Payout
        </Typography>
        <Typography color="gray" className="mt-1 text-base font-normal">
          Manage and approve GPay transfers for earned bonuses
        </Typography>
      </div>

      <IncentiveSummaryCards summary={summary} />

      <IncentiveStatusTabs value={status} onChange={onStatusChange} />

      <IncentivePayoutTable
        rows={rows}
        loading={loading}
        pagination={pagination}
        onPageChange={onPageChange}
        onView={onView}
      />

      <ActionViewModal
        open={isViewOpen}
        onClose={() => setIsViewOpen(false)}
        title="Incentive Details"
        loading={viewLoading}
        error={viewError}
        payload={viewPayload}
      />
    </div>
  );
}

export default IncentivePayoutList;
